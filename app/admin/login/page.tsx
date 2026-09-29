"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setCargando(false);
    if (signInError) {
      setError("Correo o contraseña incorrectos");
      return;
    }
    router.push("/admin");
  }

  return (
    <section className="mx-auto max-w-sm px-6 py-24">
      <h1 className="font-display text-3xl font-bold">Panel de tu negocio</h1>
      <p className="mt-2 text-sm text-muted">
        Inicia sesión para gestionar citas y servicios.
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <form onSubmit={entrar} className="mt-8 space-y-4">
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
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">Contraseña</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ¿No tienes negocio todavía?{" "}
        <a href="/registro-negocio" className="text-gold">
          Crea tu tienda
        </a>
      </p>
    </section>
  );
}
