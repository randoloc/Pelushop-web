"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [paso, setPaso] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setCargando(false);
    if (otpError) {
      setError("No encontramos una cuenta con ese correo.");
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
      setError("Código incorrecto o vencido.");
      return;
    }
    router.push("/admin");
  }

  return (
    <section className="mx-auto max-w-sm px-6 py-24">
      <h1 className="font-display text-3xl font-bold">Panel de tu negocio</h1>
      <p className="mt-2 text-sm text-muted">
        {paso === 1
          ? "Te enviaremos un código de 6 dígitos a tu correo."
          : `Escribe el código que enviamos a ${email}.`}
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {paso === 1 ? (
        <form onSubmit={enviarCodigo} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">Correo</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-surfaceBorder bg-surface px-4 py-3 text-sm text-white focus:border-gold focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-full bg-gold-gradient py-3 text-sm font-bold text-base disabled:opacity-60"
          >
            {cargando ? "Enviando..." : "Enviar código"}
          </button>
        </form>
      ) : (
        <form onSubmit={verificarCodigo} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">
              Código de 6 dígitos
            </span>
            <input
              type="text"
              required
              minLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-full rounded-xl border border-surfaceBorder bg-surface px-4 py-3 text-sm text-white focus:border-gold focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-full bg-gold-gradient py-3 text-sm font-bold text-base disabled:opacity-60"
          >
            {cargando ? "Entrando..." : "Entrar"}
          </button>
          <button
            type="button"
            onClick={() => setPaso(1)}
            className="w-full text-center text-xs text-muted"
          >
            Usar otro correo
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        ¿No tienes negocio todavía?{" "}
        <a href="/registro-negocio" className="text-gold">
          Crea tu tienda
        </a>
      </p>
    </section>
  );
}
