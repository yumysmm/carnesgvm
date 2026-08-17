# Cali Carnes

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

## 3. Administrar el contenido: panel administrativo en /#admin

La tienda tiene un panel de administración integrado en la misma app, en
la ruta `/#admin` (por ejemplo `https://tu-sitio.com/#admin`). Desde ahí
puedes crear/editar/borrar productos, banners y recetas, subir sus fotos y
videos, y cambiar tu número de WhatsApp — todo desde el celular, sin entrar
a Supabase.

### Crear tu usuario administrador

1. En Supabase, ve a **Authentication → Users → Add user**.
2. Crea tu usuario con un correo y una contraseña (esas son las que vas a
   usar para iniciar sesión en `/#admin`). Marca "Auto Confirm User" si te
   lo pregunta.
3. Asegúrate de haber corrido el `supabase/schema.sql` actualizado (incluye
   las políticas de seguridad que permiten a un usuario **autenticado**
   crear/editar/borrar, y a cualquier visitante solo leer — así nadie más
   puede tocar tu catálogo). Si ya lo habías corrido antes, vuelve a
   copiar y correr el archivo completo: las líneas repetidas no hacen daño
   (usan `if not exists` / `on conflict do nothing` donde aplica) excepto
   las políticas nuevas, que debes correr sí o sí una vez.
4. El bucket de Storage `media` (para las fotos/videos que subas desde el
   panel) también se crea automáticamente al correr ese script.

### Usar el panel

Entra a `https://tu-sitio.com/#admin`, inicia sesión, y verás 4 pestañas:
**Productos**, **Banners**, **Recetas** y **Ajustes**. Cada una te deja
crear, editar, ocultar/mostrar y borrar. Las fotos y videos se suben
directo desde tu celular o computador (quedan guardados en Supabase
Storage). Los cambios se reflejan en la tienda de inmediato, sin
necesidad de volver a publicar el sitio.

> Alternativa: si prefieres, también puedes seguir editando el catálogo
> directamente desde **Table editor** en Supabase.

## 4. Subir el código a GitHub

```bash
git init
git add .
git commit -m "Cali Carnes"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/carnexpress-lite.git
git push -u origin main
```

(Crea antes el repositorio vacío en https://github.com/new)

## 5. Publicar el sitio en GitHub Pages

Este proyecto ya viene listo para publicarse en `https://TU-USUARIO.github.io/carnesgvm/`
usando GitHub Actions (se recompila solo cada vez que subas cambios a `main`).

1. En tu repositorio de GitHub, ve a **Settings → Secrets and variables → Actions**
   y crea dos "Repository secrets":
   - `VITE_SUPABASE_URL` → tu Project URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` → tu anon public key de Supabase
2. Ve a **Settings → Pages** y en "Build and deployment / Source" elige
   **GitHub Actions**.
3. Sube el código (`git push`, ver paso anterior). Esto dispara automáticamente
   el workflow `.github/workflows/deploy.yml`, que compila el proyecto y lo
   publica.
4. Ve a la pestaña **Actions** del repo para ver el progreso. Cuando termine
   en verde, tu sitio queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

> Importante: el archivo `vite.config.js` tiene `base: "/carnesgvm/"`. Si tu
> repositorio se llama distinto a `carnesgvm`, cambia esa línea (y también
> `start_url` y `scope` un poco más abajo en el mismo archivo) para que
> coincida exactamente con el nombre de tu repositorio, o el sitio se verá
> roto (imágenes/estilos no cargan).

### Alternativa: Cloudflare Pages o Vercel

Si prefieres no usar GitHub Actions, también puedes desplegar en Cloudflare
Pages o Vercel conectando el mismo repositorio:

1. Entra a https://pages.cloudflare.com (o https://vercel.com) e inicia
   sesión con tu cuenta de GitHub.
2. "Create project" → elige el repo.
3. Framework preset: **Vite**. Build command: `npm run build`. Output
   directory: `dist`.
4. En "Environment variables" agrega `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY`.
5. Deploy. Te da una URL propia (ej. `carnesgvm.pages.dev`). En este caso
   puedes volver a poner `base: "/"` en `vite.config.js` porque no vive en
   una subcarpeta.

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
- Pagos en línea (Wompi / MercadoPago).
- Múltiples sedes (Cali, Bogotá, Medellín) con número de WhatsApp distinto
  según ciudad.
