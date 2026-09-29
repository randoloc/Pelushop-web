import type { Negocio } from "@/lib/supabase";

export function ShopCard({ negocio }: { negocio: Negocio }) {
  return (
    <a
      href={`/tienda/${negocio.slug}`}
      className="group block overflow-hidden rounded-2xl border border-surfaceBorder bg-surface transition-colors hover:border-gold/60"
    >
      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-surface to-base">
        {negocio.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={negocio.logo_url}
            alt={negocio.nombre}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-display text-4xl font-bold text-gold/80">
            {negocio.nombre.charAt(0)}
          </span>
        )}
      </div>
      <div className="space-y-1 p-4">
        <h3 className="font-display text-lg font-bold text-white group-hover:text-gold">
          {negocio.nombre}
        </h3>
        <p className="line-clamp-2 text-sm text-muted">
          {negocio.descripcion || negocio.direccion || "Salón de belleza"}
        </p>
      </div>
    </a>
  );
}
