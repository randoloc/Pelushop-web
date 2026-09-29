-- ============================================================
-- PeluShop · Fix: creación de negocio + reservas de invitado
-- ============================================================

-- Problema que resuelve esta migración:
-- La política "admins_negocio_insert" exige ya ser admin del
-- negocio para poder insertarte como admin de ese negocio — lo cual
-- es imposible para el primer admin de un negocio nuevo. Se resuelve
-- con una función SECURITY DEFINER que crea el negocio y el primer
-- admin (owner) en una sola transacción atómica.

create or replace function crear_negocio(
  p_nombre        text,
  p_slug          text,
  p_descripcion   text default null,
  p_telefono      text default null,
  p_direccion     text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_negocio_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para crear un negocio';
  end if;

  insert into negocios (nombre, slug, descripcion, telefono, direccion)
  values (p_nombre, p_slug, p_descripcion, p_telefono, p_direccion)
  returning id into v_negocio_id;

  insert into admins_negocio (negocio_id, user_id, rol)
  values (v_negocio_id, auth.uid(), 'owner');

  return v_negocio_id;
end;
$$;

grant execute on function crear_negocio(text, text, text, text, text) to authenticated;

-- ------------------------------------------------------------
-- Reservas de invitado: permitir cliente_user_id nulo (booking
-- sin necesidad de crear cuenta), sin perder el caso de cliente
-- autenticado.
-- ------------------------------------------------------------
drop policy if exists "citas_cliente_insert" on citas;

create policy "citas_cliente_insert" on citas
  for insert
  with check (
    cliente_user_id = auth.uid()
    or cliente_user_id is null
  );
