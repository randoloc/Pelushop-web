import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json();
  const {
    negocio_id,
    cliente_nombre,
    cliente_telefono,
    cliente_email,
    fecha,
    hora,
    servicios, // [{ id, precio }]
  } = body;

  if (!negocio_id || !cliente_nombre || !fecha || !hora || !servicios?.length) {
    return NextResponse.json(
      { error: "Faltan datos obligatorios" },
      { status: 400 },
    );
  }

  const { data: citaId, error: rpcError } = await supabase.rpc("crear_cita", {
    p_negocio_id: negocio_id,
    p_cliente_nombre: cliente_nombre,
    p_cliente_telefono: cliente_telefono ?? null,
    p_cliente_email: cliente_email ?? null,
    p_fecha: fecha,
    p_hora: hora,
    p_servicios: servicios,
  });

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 400 });
  }

  return NextResponse.json({ cita: { id: citaId } });
}
