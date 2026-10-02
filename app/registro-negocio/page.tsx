"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { subirImagen } from "@/lib/storage";

function slugify(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function RegistroNegocioPage() {
  const router = useRouter();
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [logo, setLogo] = useState<File | null>(null);

  async function enviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setCargando(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setPaso(2);
  }

  async function verificarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: codigo,
      type: "email",
    });
    setCargando(false);
    if (verifyError) {
      setError("Código incorrecto o vencido. Revisa tu correo e intenta de nuevo.");
      return;
    }
    setPaso(3);
  }

  async function crearNegocio(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    const slug = slugify(nombreNegocio);
    const { data, error: rpcError } = await supabase.rpc("crear_negocio", {
      p_nombre: nombreNegocio,
      p_slug: slug,
      p_descripcion: descripcion || null,
      p_telefono: telefono || null,
      p_direccion: direccion || null,
    });

    setCargando(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    const negocioId = data as string;

    if (logo) {
      const url = await subirImagen(negocioId, logo);
      if (url) {
        await supabase
          .from("negocios")
          .update({ logo_url: url })
          .eq("id", negocioId);
      }
    }

    router.push(`/tienda/${slug}`);
  }

  const titulos = {
    1: "Crea tu cuenta",
    2: "Verifica tu correo",
    3: "Cuéntanos de tu negocio",
  } as const;

  const subtitulos = {
    1: "Te enviaremos un código de 6 dígitos para confirmar que este correo es tuyo.",
    2: `Escribe el código que enviamos a ${email}.`,
    3: "Estos datos se mostrarán en tu página pública.",
  } as const;

  return (
    <section className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-3xl font-bold">{titulos[paso]}</h1>
      <p className="mt-2 text-sm text-muted">{subtitulos[paso]}</p>

      {error && (
        <p className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {paso === 1 && (
        <form onSubmit={enviarCodigo} className="mt-8 space-y-4">
          <Campo
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={setEmail}
            required
          />
          <Boton texto="Enviar código" cargando={cargando} />
        </form>
      )}

      {paso === 2 && (
        <form onSubmit={verificarCodigo} className="mt-8 space-y-4">
          <Campo
            label="Código de 6 dígitos"
            type="text"
            value={codigo}
            onChange={setCodigo}
            required
            minLength={6}
          />
          <Boton texto="Verificar" cargando={cargando} />
          <button
            type="button"
            onClick={() => setPaso(1)}
            className="w-full text-center text-xs text-muted"
          >
            Usar otro correo
          </button>
        </form>
      )}

      {paso === 3 && (
        <form onSubmit={crearNegocio} className="mt-8 space-y-4">
          <Campo
            label="Nombre del negocio"
            value={nombreNegocio}
            onChange={setNombreNegocio}
            required
          />
          <Campo
            label="Descripción breve"
            value={descripcion}
            onChange={setDescripcion}
          />
          <Campo label="Teléfono" value={telefono} onChange={setTelefono} />
          <Campo
            label="Dirección"
            value={direccion}
            onChange={setDireccion}
          />
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">
              Logo (opcional)
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-gold-gradient file:px-4 file:py-2 file:text-xs file:font-bold file:text-base"
            />
          </label>
          <Boton texto="Crear mi tienda" cargando={cargando} />
        </form>
      )}
    </section>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
  required,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-muted">{label}</span>
      <input
        type={type}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-surfaceBorder bg-surface px-4 py-3 text-sm text-white focus:border-gold focus:outline-none"
      />
    </label>
  );
}

function Boton({ texto, cargando }: { texto: string; cargando: boolean }) {
  return (
    <button
      type="submit"
      disabled={cargando}
      className="w-full rounded-full bg-gold-gradient py-3 text-sm font-bold text-base disabled:opacity-60"
    >
      {cargando ? "Un momento..." : texto}
    </button>
  );
}
