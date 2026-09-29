# Desplegar PeluShop en Cloudflare Pages

## 1. Subir el proyecto a GitHub (desde una computadora)
1. Crea un repositorio nuevo en GitHub (ej. `pelushop-web`).
2. Descomprime este proyecto y sube TODO su contenido a la raíz del repo
   (en la web de GitHub: Add file > Upload files, arrastrando la carpeta completa).
   No subas `node_modules` ni `.env`.

## 2. Conectar con Cloudflare Pages
1. dash.cloudflare.com > Workers & Pages > Create > Pages > Connect to Git.
2. Elige el repositorio `pelushop-web`.
3. Configuración de build:
   - Framework preset: Next.js
   - Build command: `npx @cloudflare/next-on-pages@1`
   - Build output directory: `.vercel/output/static`
4. Variables de entorno (Settings > Variables and Secrets):
   - `NEXT_PUBLIC_SUPABASE_URL` = https://ubmjcdmzfelgmyjuowgf.supabase.co
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = la clave publishable de tu proyecto Supabase
5. Settings > Compatibility flags: agrega `nodejs_compat` (Production y Preview).
6. Save and Deploy. La URL queda como `https://<nombre>.pages.dev`.
