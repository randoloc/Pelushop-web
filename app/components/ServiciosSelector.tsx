"use client";

import { useState } from "react";
import type { Servicio, Categoria } from "@/lib/supabase";

export function ServiciosSelector({
  servicios,
  categorias,
  negocioId,
}: {
  servicios: Servicio[];
  categorias: Categoria[];
  negocioId: string;
}) {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [mostrarForm, setMostrarForm] = useState(false);
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");

  function toggle(id: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const elegidos = servicios.filter((s) => seleccionados.has(s.id));
  const total = elegidos.reduce((sum, s) => sum + Number(s.precio), 0);
  const duracion = elegidos.reduce((sum, s) => sum + s.duracion_minutos, 0);

  async function confirmarReserva(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    setErrorMsg("");

    const res = await fetch("/api/citas", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        negocio_id: negocioId,
        cliente_nombre: nombre,
        cliente_telefono: telefono,
        cliente_email: email,
        fecha,
        hora,
        servicios: elegidos.map((s) => ({ id: s.id, precio: s.precio })),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setErrorMsg(data.error || "No se pudo agendar la cita");
      setEstado("error");
      return;
    }

    setEstado("ok");
  }

  if (estado === "ok") {
    return (
      <div className="rounded-2xl border border-success/40 bg-success/10 p-6 text-center">
        <p className="font-display text-lg font-bold text-white">
          ¡Cita agendada!
        </p>
        <p className="mt-1 text-sm text-muted">
          El negocio recibirá tu solicitud y te confirmará pronto.
        </p>
      </div>
    );
  }

  const grupos = [
    ...categorias.map((cat) => ({
      id: cat.id,
      nombre: cat.nombre,
      items: servicios.filter((s) => s.categoria_id === cat.id),
    })),
    {
      id: "sin-categoria",
      nombre: "Otros servicios",
      items: servicios.filter(
        (s) => !categorias.some((c) => c.id === s.categoria_id),
      ),
    },
  ].filter((g) => g.items.length > 0);

  return (
    <div>
      {grupos.map((grupo) => (
        <div key={grupo.id} className="mb-6">
          {categorias.length > 0 && (
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              {grupo.nombre}
            </h3>
          )}
          <ul className="divide-y divide-surfaceBorder rounded-2xl border border-surfaceBorder bg-surface">
            {grupo.items.map((servicio) => {
              const activo = seleccionados.has(servicio.id);
              return (
                <li
                  key={servicio.id}
                  onClick={() => toggle(servicio.id)}
                  className={`flex cursor-pointer items-center justify-between px-5 py-4 transition-colors ${
                    activo ? "bg-gold/10" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {servicio.imagenes?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={servicio.imagenes[0]}
                        alt={servicio.nombre}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium text-white">
                        {servicio.nombre}
                      </p>
                      <p className="text-xs text-muted">
                        {servicio.duracion_minutos} min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gold">
                      ${Number(servicio.precio).toFixed(0)}
                    </span>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                        activo
                          ? "border-gold bg-gold text-base"
                          : "border-surfaceBorder"
                      }`}
                    >
                      {activo && "✓"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {elegidos.length > 0 && !mostrarForm && (
        <div className="sticky bottom-4 mt-4 flex items-center justify-between rounded-2xl border border-gold/40 bg-surface px-5 py-4">
          <div>
            <p className="text-sm text-white">
              {elegidos.length} servicio{elegidos.length > 1 ? "s" : ""} ·{" "}
              {duracion} min
            </p>
            <p className="text-lg font-bold text-gold">${total.toFixed(0)}</p>
          </div>
          <button
            onClick={() => setMostrarForm(true)}
            className="rounded-full bg-gold-gradient px-6 py-3 text-sm font-bold text-base"
          >
            Agendar cita
          </button>
        </div>
      )}

      {mostrarForm && (
        <form
          onSubmit={confirmarReserva}
          className="mt-4 space-y-3 rounded-2xl border border-surfaceBorder bg-surface p-5"
        >
          <p className="font-display text-lg font-bold">Tus datos</p>
          {errorMsg && (
            <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
              {errorMsg}
            </p>
          )}
          <Campo label="Nombre" value={nombre} onChange={setNombre} required />
          <Campo
            label="Teléfono"
            value={telefono}
            onChange={setTelefono}
            required
          />
          <Campo
            label="Email (opcional)"
            type="email"
            value={email}
            onChange={setEmail}
          />
          <div className="grid grid-cols-2 gap-3">
            <Campo
              label="Fecha"
              type="date"
              value={fecha}
              onChange={setFecha}
              required
            />
            <Campo
              label="Hora"
              type="time"
              value={hora}
              onChange={setHora}
              required
            />
          </div>
          <button
            type="submit"
            disabled={estado === "enviando"}
            className="w-full rounded-full bg-gold-gradient py-3 text-sm font-bold text-base disabled:opacity-60"
          >
            {estado === "enviando"
              ? "Enviando..."
              : `Confirmar por $${total.toFixed(0)}`}
          </button>
        </form>
      )}
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-surfaceBorder bg-base px-3 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
      />
    </label>
  );
}
