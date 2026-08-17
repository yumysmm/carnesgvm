-- Ejecuta esto en Supabase: panel izquierdo > SQL Editor > New query > pega y "Run"

create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  link_url text,
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric not null default 0,
  category text default 'General',
  image_url text,
  active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  video_url text not null, -- link de YouTube o archivo .mp4 público
  thumbnail_url text,
  description text,
  active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists settings (
  key text primary key,
  value text
);

insert into settings (key, value) values
  ('whatsapp_cali', '573000000000'),
  ('intro_title', 'Carne fresca a domicilio'),
  ('intro_subtitle', 'Elige tus productos y confirma tu pedido por WhatsApp.')
on conflict (key) do nothing;

-- Datos de ejemplo (bórralos cuando cargues los tuyos reales)
insert into products (name, description, price, category, active) values
  ('Combo Junior', 'Más de 6 productos distintos, obsequio incluido', 119900, 'Combos', true),
  ('Pechuga de pollo', 'Libra', 12000, 'Pollo', true),
  ('Chorizo ahumado', 'Paquete x500g', 15000, 'Cerdo', true)
on conflict do nothing;

-- Seguridad: permitir lectura pública (para que la tienda cargue sin login)
alter table banners enable row level security;
alter table products enable row level security;
alter table recipes enable row level security;
alter table settings enable row level security;

create policy "Lectura publica banners" on banners for select using (true);
create policy "Lectura publica products" on products for select using (true);
create policy "Lectura publica recipes" on recipes for select using (true);
create policy "Lectura publica settings" on settings for select using (true);

-- IMPORTANTE: por defecto NADIE puede insertar/editar/borrar desde el sitio público.
-- Para administrar el catálogo, hazlo desde el panel de Supabase (Table editor),
-- o pídeme más adelante un panel admin con login para hacerlo desde el celular.
