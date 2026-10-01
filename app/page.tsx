import { getNegocios } from "@/lib/supabase";
import { ShopCard } from "./components/ShopCard";

const CATEGORIAS = ["Cortes", "Color", "Tratamientos", "Uñas", "Barbería"];

export default async function HomePage() {
  const negocios = await getNegocios();

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
        <div className="grid items-center gap-12 sm:grid-cols-2">
          <div>
            <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
              Tu próximo corte,
              <br />
              a un turno de distancia.
            </h1>
            <p className="mt-5 max-w-md text-muted">
              Descubre peluquerías y salones cerca de ti, mira sus servicios y
              precios reales, y agenda tu cita sin llamadas ni esperas.
            </p>
            <form className="mt-8 flex max-w-md overflow-hidden rounded-full border border-surfaceBorder bg-surface">
              <input
                type="text"
                placeholder="Busca por zona o tipo de servicio"
                className="flex-1 bg-transparent px-5 py-3 text-sm text-white placeholder:text-muted focus:outline-none"
              />
              <button className="bg-gold-gradient px-6 text-sm font-bold text-base">
                Buscar
              </button>
            </form>
            <div className="mt-6 flex flex-wrap gap-2">
              {CATEGORIAS.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full border border-surfaceBorder px-4 py-1.5 text-xs text-muted"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Collage decorativo, sin foto de stock */}
          <div className="relative hidden h-80 sm:block">
            <div className="absolute right-8 top-0 h-44 w-44 rounded-full border border-gold/30" />
            <div className="absolute right-24 top-16 h-32 w-32 rounded-full bg-gold-gradient opacity-90" />
            <div className="absolute right-0 top-40 h-24 w-24 rounded-full border border-surfaceBorder" />
            <span className="absolute right-16 top-28 font-display text-6xl font-bold text-base">
              B
            </span>
          </div>
        </div>
      </section>

      {/* Tiendas destacadas */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold">
            Tiendas destacadas
          </h2>
        </div>

        {negocios.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surfaceBorder p-10 text-center text-muted">
            Todavía no hay tiendas publicadas. En cuanto configures tu
            proyecto de Supabase (variables{" "}
            <code className="text-gold">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
            <code className="text-gold">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>)
            y crees el primer negocio, aparecerá aquí automáticamente.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {negocios.map((negocio) => (
              <ShopCard key={negocio.id} negocio={negocio} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
