-- ============================================================
-- PeluShop · Migración: marketplace multi-tienda
-- Convierte el proyecto de "una peluquería" a un marketplace
-- donde múltiples negocios gestionan su propia tienda digital.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. NEGOCIOS (tenants)
-- ------------------------------------------------------------
create table if not exists negocios (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  slug          text not null unique,          -- para URL pública: /tienda/<slug>
  descripcion   text,
  logo_url      text,
  color_primario text default '#111111',
  direccion     text,
  telefono      text,
  activo        boolean not null default true,
  creado_en     timestamptz not null default now()
);

comment on table negocios is 'Cada fila = una peluquería/negocio dentro del marketplace';

-- ------------------------------------------------------------
-- 2. ADMINS_NEGOCIO (quién administra cada negocio)
-- ------------------------------------------------------------
create table if not exists admins_negocio (
  id                uuid primary key default gen_random_uuid(),
  negocio_id        uuid not null references negocios(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  rol               text not null default 'admin' check (rol in ('owner','admin','estilista')),
  nombre_visible    text,
  telegram_chat_id  text,   -- chat_id del bot de Telegram para este admin
  whatsapp_numero   text,   -- número con código de país, para CallMeBot
  creado_en         timestamptz not null default now(),
  unique (negocio_id, user_id)
);

create index if not exists idx_admins_negocio_negocio on admins_negocio(negocio_id);
create index if not exists idx_admins_negocio_user on admins_negocio(user_id);

-- ------------------------------------------------------------
-- 3. CATEGORÍAS Y SERVICIOS
-- ------------------------------------------------------------
create table if not exists categorias_servicio (
  id          uuid primary key default gen_random_uuid(),
  negocio_id  uuid not null references negocios(id) on delete cascade,
  nombre      text not null,
  orden       int not null default 0
);

create table if not exists servicios (
  id                uuid primary key default gen_random_uuid(),
  negocio_id        uuid not null references negocios(id) on delete cascade,
  categoria_id      uuid references categorias_servicio(id) on delete set null,
  nombre            text not null,
  descripcion       text,
  precio            numeric(10,2) not null,
  duracion_minutos  int not null default 30,
  imagenes          text[] not null default '{}',  -- URLs en Supabase Storage
  activo            boolean not null default true,
  creado_en         timestamptz not null default now()
);

create index if not exists idx_servicios_negocio on servicios(negocio_id);

-- ------------------------------------------------------------
-- 4. HORARIOS DE DISPONIBILIDAD
-- ------------------------------------------------------------
create table if not exists horarios_disponibilidad (
  id          uuid primary key default gen_random_uuid(),
  negocio_id  uuid not null references negocios(id) on delete cascade,
  admin_id    uuid references admins_negocio(id) on delete cascade, -- null = horario general del negocio
  dia_semana  int not null check (dia_semana between 0 and 6),      -- 0=domingo
  hora_inicio time not null,
  hora_fin    time not null,
  activo      boolean not null default true
);

create index if not exists idx_horarios_negocio on horarios_disponibilidad(negocio_id);

-- ------------------------------------------------------------
-- 5. EVENTOS / RECORDATORIOS (creados por el admin)
-- ------------------------------------------------------------
create table if not exists eventos (
  id              uuid primary key default gen_random_uuid(),
  negocio_id      uuid not null references negocios(id) on delete cascade,
  creado_por      uuid references admins_negocio(id),
  titulo          text not null,
  descripcion     text,
  tipo            text not null default 'evento' check (tipo in ('evento','recordatorio')),
  fecha_hora      timestamptz not null,
  notificar_push  boolean not null default true,
  creado_en       timestamptz not null default now()
);

create index if not exists idx_eventos_negocio on eventos(negocio_id);

-- ------------------------------------------------------------
-- 6. CITAS (reservas de clientes)
-- ------------------------------------------------------------
create table if not exists citas (
  id                 uuid primary key default gen_random_uuid(),
  negocio_id         uuid not null references negocios(id) on delete cascade,
  cliente_user_id    uuid references auth.users(id),
  cliente_nombre     text not null,
  cliente_telefono   text,
  cliente_email      text,
  admin_asignado_id  uuid references admins_negocio(id),
  fecha              date not null,
  hora               time not null,
  estado             text not null default 'pendiente'
                       check (estado in ('pendiente','confirmada','completada','cancelada')),
  notas              text,
  total              numeric(10,2),
  creado_en          timestamptz not null default now()
);

create index if not exists idx_citas_negocio on citas(negocio_id);
create index if not exists idx_citas_fecha on citas(negocio_id, fecha);

-- Servicios elegidos dentro de una cita (uno o varios)
create table if not exists cita_servicios (
  cita_id            uuid not null references citas(id) on delete cascade,
  servicio_id        uuid not null references servicios(id),
  precio_al_momento  numeric(10,2) not null,
  primary key (cita_id, servicio_id)
);

-- ------------------------------------------------------------
-- 7. DEVICE TOKENS (para el push nativo in-app)
-- ------------------------------------------------------------
create table if not exists device_tokens (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade,
  negocio_id     uuid references negocios(id) on delete cascade, -- null si el token es de un cliente sin negocio fijo
  rol            text not null check (rol in ('cliente','admin')),
  fcm_token      text not null unique,
  plataforma     text not null check (plataforma in ('android','ios')),
  actualizado_en timestamptz not null default now()
);

create index if not exists idx_device_tokens_negocio on device_tokens(negocio_id) where rol = 'admin';

-- ------------------------------------------------------------
-- 8. LOG DE NOTIFICACIONES (auditoría de los 4 canales)
-- ------------------------------------------------------------
create table if not exists notificaciones_log (
  id          uuid primary key default gen_random_uuid(),
  negocio_id  uuid references negocios(id),
  cita_id     uuid references citas(id),
  evento_id   uuid references eventos(id),
  canal       text not null check (canal in ('telegram','email','whatsapp','push')),
  destinatario text,
  estado      text not null check (estado in ('enviado','error')),
  detalle     text,
  creado_en   timestamptz not null default now()
);

-- ============================================================
-- RLS (Row Level Security) — aislamiento por negocio
-- ============================================================

alter table negocios enable row level security;
alter table admins_negocio enable row level security;
alter table categorias_servicio enable row level security;
alter table servicios enable row level security;
alter table horarios_disponibilidad enable row level security;
alter table eventos enable row level security;
alter table citas enable row level security;
alter table cita_servicios enable row level security;
alter table device_tokens enable row level security;
alter table notificaciones_log enable row level security;

-- Helper: ¿el usuario actual es admin de este negocio?
create or replace function es_admin_de(p_negocio_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from admins_negocio
    where negocio_id = p_negocio_id and user_id = auth.uid()
  );
$$;

-- negocios: catálogo público de solo-lectura para negocios activos
create policy "negocios_publico_select" on negocios
  for select using (activo = true);

create policy "negocios_admin_update" on negocios
  for update using (es_admin_de(id));

-- admins_negocio: cada admin ve/gestiona solo su propio negocio
create policy "admins_negocio_select" on admins_negocio
  for select using (es_admin_de(negocio_id));

create policy "admins_negocio_insert" on admins_negocio
  for insert with check (es_admin_de(negocio_id));

-- catálogo público (servicios, categorías, horarios): lectura abierta si el negocio está activo
create policy "categorias_publico_select" on categorias_servicio
  for select using (true);
create policy "categorias_admin_write" on categorias_servicio
  for all using (es_admin_de(negocio_id)) with check (es_admin_de(negocio_id));

create policy "servicios_publico_select" on servicios
  for select using (activo = true);
create policy "servicios_admin_write" on servicios
  for all using (es_admin_de(negocio_id)) with check (es_admin_de(negocio_id));

create policy "horarios_publico_select" on horarios_disponibilidad
  for select using (activo = true);
create policy "horarios_admin_write" on horarios_disponibilidad
  for all using (es_admin_de(negocio_id)) with check (es_admin_de(negocio_id));

-- eventos: solo admins del negocio los ven/gestionan
create policy "eventos_admin_all" on eventos
  for all using (es_admin_de(negocio_id)) with check (es_admin_de(negocio_id));

-- citas: el cliente ve/crea las suyas; el admin ve/gestiona las de su negocio
create policy "citas_cliente_select" on citas
  for select using (cliente_user_id = auth.uid() or es_admin_de(negocio_id));

create policy "citas_cliente_insert" on citas
  for insert with check (cliente_user_id = auth.uid());

create policy "citas_admin_update" on citas
  for update using (es_admin_de(negocio_id));

-- cita_servicios: sigue la visibilidad de la cita padre
create policy "cita_servicios_select" on cita_servicios
  for select using (
    exists (select 1 from citas c where c.id = cita_id
            and (c.cliente_user_id = auth.uid() or es_admin_de(c.negocio_id)))
  );
create policy "cita_servicios_insert" on cita_servicios
  for insert with check (
    exists (select 1 from citas c where c.id = cita_id and c.cliente_user_id = auth.uid())
  );

-- device_tokens: cada usuario administra solo su propio token
create policy "device_tokens_propio" on device_tokens
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- notificaciones_log: solo lectura para admins del negocio (auditoría)
create policy "notificaciones_log_admin_select" on notificaciones_log
  for select using (es_admin_de(negocio_id));
