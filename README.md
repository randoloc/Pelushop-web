# PeluShop Web

Sitio del marketplace (Next.js 14, App Router, Tailwind), consumiendo
el mismo proyecto de Supabase que la app Qt.

## Arrancar

```bash
npm install
cp .env.example .env.local   # completar con tu URL y anon key de Supabase
npm run dev
```

## Estructura

- `app/page.tsx` — home del marketplace (buscador + tiendas destacadas)
- `app/tienda/[slug]/page.tsx` — página pública de una tienda, con
  selección de uno o varios servicios
- `lib/supabase.ts` — cliente y consultas a Supabase (negocios,
  servicios)
- `tailwind.config.js` — paleta de colores tomada de la app Qt
  (dorado `#D4AF37`, fondo `#0D0D0D`, superficies `#141414`)

## Ya funcional

- `/registro-negocio` — crea cuenta (Supabase Auth) + el negocio, vía
  la función `crear_negocio` (ver migración
  `20260922130000_crear_negocio_rpc.sql`, **hay que aplicarla** además
  de la del esquema multi-tenant).
- `/tienda/[slug]` — selección de uno o varios servicios y formulario
  de reserva real, que inserta en `citas` + `cita_servicios` vía
  `app/api/citas/route.ts`. Permite reserva de invitado (sin cuenta).
- `/admin/login` y `/admin` — panel del negocio: ver citas y
  confirmar/cancelar, ver servicios y agregar nuevos.

## Pendiente para la siguiente vuelta

- Subida de fotos/logo a Supabase Storage (hoy no hay campo de imagen
  en el formulario de registro ni en "agregar servicio")
- Editar/eliminar servicios desde el panel (hoy solo agregar)
- Categorías de servicio (la tabla `categorias_servicio` existe pero
  el sitio aún no las usa para agrupar/filtrar)
- Páginas de categoría / búsqueda por ubicación en el home
- Notificaciones (Telegram/Email/WhatsApp/Push) al crear una cita —
  ya están armadas como Edge Function (`supabase/functions/notificar`),
  falta conectar el Database Webhook en el dashboard de Supabase
- El login de admin usa sesión de navegador simple
  (`@supabase/supabase-js` directo); para producción conviene migrar
  a `@supabase/ssr` con cookies para que el middleware pueda proteger
  `/admin` a nivel de servidor

Ver `docs/ARQUITECTURA.md` y las migraciones de `supabase/` para el
modelo de datos completo.
