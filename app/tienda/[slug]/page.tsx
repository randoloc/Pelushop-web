export const runtime = "edge";
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getNegocioPorSlug,
  getServiciosDeNegocio,
  getCategoriasDeNegocio,
} from "@/lib/supabase";
import { ServiciosSelector } from "../../components/ServiciosSelector";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const negocio = await getNegocioPorSlug(params.slug);
  if (!negocio) return { title: "Tienda no encontrada — PeluShop" };

  const titulo = `${negocio.nombre} — Reserva tu cita | PeluShop`;
  const descripcion =
    negocio.descripcion ||
    `Agenda tu cita en ${negocio.nombre}${
      negocio.direccion ? `, ${negocio.direccion}` : ""
    }. Elige tus servicios y reserva en segundos.`;

  return {
    title: titulo,
    description: descripcion,
    openGraph: {
      title: titulo,
      description: descripcion,
      images: negocio.logo_url ? [negocio.logo_url] : [],
      type: "website",
    },
    alternates: { canonical: `/tienda/${negocio.slug}` },
  };
}

export default async function TiendaPage({
  params,
}: {
  params: { slug: string };
}) {
  const negocio = await getNegocioPorSlug(params.slug);
  if (!negocio) notFound();

  const [servicios, categorias] = await Promise.all([
    getServiciosDeNegocio(negocio.id),
    getCategoriasDeNegocio(negocio.id),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: negocio.nombre,
    description: negocio.descripcion ?? undefined,
    image: negocio.logo_url ?? undefined,
    address: negocio.direccion ?? undefined,
    url: `https://pelushop.app/tienda/${negocio.slug}`,
    makesOffer: servicios.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.nombre },
      price: s.precio,
      priceCurrency: "USD",
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="border-b border-surfaceBorder bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <div className="flex items-center gap-4">
            {negocio.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={negocio.logo_url}
                alt={negocio.nombre}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-gradient font-display text-2xl font-bold text-base">
                {negocio.nombre.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="font-display text-3xl font-bold">
                {negocio.nombre}
              </h1>
              {negocio.direccion && (
                <p className="text-sm text-muted">{negocio.direccion}</p>
              )}
            </div>
          </div>
          {negocio.descripcion && (
            <p className="mt-6 max-w-2xl text-muted">{negocio.descripcion}</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h2 className="mb-4 font-display text-xl font-bold">
          Elige uno o varios servicios
        </h2>
        {servicios.length === 0 ? (
          <p className="text-muted">
            Esta tienda todavía no publicó sus servicios.
          </p>
        ) : (
          <ServiciosSelector
            servicios={servicios}
            categorias={categorias}
            negocioId={negocio.id}
          />
        )}
      </section>
    </>
  );
}
