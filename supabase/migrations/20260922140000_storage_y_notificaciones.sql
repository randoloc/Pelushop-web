-- ============================================================
-- PeluShop · Storage (fotos/logos) + trigger de notificaciones
-- ============================================================

-- ------------------------------------------------------------
-- 1. Bucket para fotos de negocio y servicios
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('negocios-media', 'negocios-media', true)
on conflict (id) do nothing;

-- Lectura pública (son fotos de catálogo, deben verse sin login)
create policy if not exists "negocios_media_publico_select"
  on storage.objects for select
  using (bucket_id = 'negocios-media');

-- Solo admins autenticados pueden subir, dentro de la carpeta de
-- SU propio negocio (convención de ruta: <negocio_id>/archivo.jpg)
create policy if not exists "negocios_media_admin_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'negocios-media'
    and es_admin_de((storage.foldername(name))[1]::uuid)
  );

create policy if not exists "negocios_media_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'negocios-media'
    and es_admin_de((storage.foldername(name))[1]::uuid)
  );

-- ------------------------------------------------------------
-- 2. Trigger de notificaciones (alternativa a configurar el
--    Database Webhook a mano desde el dashboard).
--
--    Reemplaza los placeholders antes de aplicar:
--      <TU_PROJECT_REF>  -> el ref de tu proyecto Supabase
--      <TU_ANON_KEY>     -> tu anon key
-- ------------------------------------------------------------
create extension if not exists pg_net;

create or replace function notificar_via_edge_function()
returns trigger
language plpgsql
security definer
as $$
begin
  perform net.http_post(
    url := 'https://<TU_PROJECT_REF>.functions.supabase.co/notificar',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <TU_ANON_KEY>'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW)
    )
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notificar_cita on citas;
create trigger trg_notificar_cita
  after insert on citas
  for each row execute function notificar_via_edge_function();

drop trigger if exists trg_notificar_evento on eventos;
create trigger trg_notificar_evento
  after insert on eventos
  for each row execute function notificar_via_edge_function();
