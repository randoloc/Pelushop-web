import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PeluShop — Encuentra y reserva en tu salón de belleza",
  description:
    "Marketplace de peluquerías y salones de belleza: descubre negocios cerca de ti y agenda tu cita en segundos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="font-body min-h-screen bg-base text-white">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header className="border-b border-surfaceBorder">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <a href="/" className="flex shrink-0 items-center gap-2">
          <span className="font-display text-2xl font-bold text-gold">B</span>
          <span className="font-display text-lg font-bold tracking-tight">
            PeluShop
          </span>
        </a>
        <nav className="hidden gap-8 text-sm text-muted sm:flex">
          <a href="/" className="hover:text-white">
            Explorar
          </a>
          <a href="/registro-negocio" className="hover:text-white">
            Registra tu negocio
          </a>
        </nav>
        <a
          href="/registro-negocio"
          className="shrink-0 whitespace-nowrap rounded-full bg-gold-gradient px-4 py-2 text-xs font-bold text-base sm:px-5 sm:py-2 sm:text-sm"
        >
          Crear mi tienda
        </a>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-surfaceBorder">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-muted">
        © {new Date().getFullYear()} PeluShop. Belleza y elegancia, cerca de ti.
      </div>
    </footer>
  );
}
