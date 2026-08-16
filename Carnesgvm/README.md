# Carnexpress Lite

Tienda online de carnes: banners, catálogo con carrito, videos de recetas y
pedido final por WhatsApp. Los datos (banners, productos, recetas, ajustes)
viven en **Supabase**. El código vive en **GitHub** y se publica como una
**PWA** (se puede "instalar" desde el navegador del celular, con ícono en
la pantalla de inicio).

## 1. Crear el proyecto en Supabase

1. Entra a https://supabase.com y crea una cuenta gratis.
2. "New project" → ponle un nombre (ej. `carnexpress`) y una contraseña de
   base de datos (guárdala, no la necesitas para esta app pero sí para el
   panel).
3. Cuando el proyecto esté listo, ve a **SQL Editor → New query**, pega
   todo el contenido de [`supabase/schema.sql`](supabase/schema.sql) y dale
   **Run**. Esto crea las tablas `banners`, `products`, `recipes`,
   `settings` y deja 3 productos de ejemplo.
4. Ve a **Project Settings → API**. Copia:
   - `Project URL` → lo vas a usar como `VITE_SUPABASE_URL`
   - `anon public` key → lo vas a usar como `VITE_SUPABASE_ANON_KEY`

## 2. Configurar el proyecto localmente

```bash
cp .env.example .env
# abre .env y pega tu Project URL y tu anon key
npm install
npm run dev
```

Abre la URL que te muestra la terminal (normalmente `http://localhost:5173`).

## 3. Administrar el contenido (banners, productos, recetas)

Por ahora se administra directamente desde Supabase, sin necesidad de un
panel aparte:

- Ve a **Table editor** en Supabase.
- **banners**: agrega filas con `image_url` (sube la imagen a algún hosting
  o al *Storage* de Supabase y pega el link público), `sort_order` y
  `active`.
- **products**: `name`, `description`, `price`, `category`, `image_url`,
  `active`.
- **recipes**: `title`, `video_url` (pega un link de YouTube o un `.mp4`
  público), `active`.
- **settings**: cambia `whatsapp_cali` por tu número real (formato
  `57XXXXXXXXXX`), y `intro_title` / `intro_subtitle` por tu mensaje.

> Cuando quieras, puedo construirte un panel de administración con login
> para que edites todo esto desde el celular sin entrar a Supabase.

## 4. Subir el código a GitHub

```bash
git init
git add .
git commit -m "Carnexpress Lite"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/carnexpress-lite.git
git push -u origin main
```

(Crea antes el repositorio vacío en https://github.com/new)

## 5. Publicar la tienda (para que el cliente pueda "instalarla")

Recomendado: **Cloudflare Pages** o **Vercel** (ambos gratis y se conectan
directo a GitHub):

1. Entra a https://pages.cloudflare.com (o https://vercel.com) e inicia
   sesión con tu cuenta de GitHub.
2. "Create project" → elige el repo `carnexpress-lite`.
3. Framework preset: **Vite**. Build command: `npm run build`. Output
   directory: `dist`.
4. En "Environment variables" agrega `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY` con los mismos valores de tu `.env`.
5. Deploy. Te da una URL pública (ej. `carnexpress-lite.pages.dev`).

## 6. "Descargar" la app en el celular (PWA)

No necesitas subirla a Play Store / App Store. Cuando el cliente entra a
tu URL desde el navegador del celular:

- **Android (Chrome)**: aparece un aviso o el menú ⋮ → "Instalar app" /
  "Agregar a pantalla de inicio".
- **iPhone (Safari)**: botón compartir → "Agregar a pantalla de inicio".

Se agrega un ícono como si fuera una app nativa, abre en pantalla completa
y funciona offline para lo ya cargado. Antes de publicar, reemplaza los
íconos de ejemplo en `public/icons/` (ver `public/icons/README.txt`).

## Siguientes pasos posibles
- Panel de administración con login (sin tocar Supabase directamente).
- Pagos en línea (Wompi / MercadoPago).
- Múltiples sedes (Cali, Bogotá, Medellín) con número de WhatsApp distinto
  según ciudad, como en Carnexpress.
