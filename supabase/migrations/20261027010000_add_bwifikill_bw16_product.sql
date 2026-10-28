insert into public.products (
  slug,
  name,
  description,
  firmware_name,
  repository_url,
  image_url,
  price_mxn,
  stock,
  active
) values (
  'bwifikill-bw16-deauther',
  'BWifiKill BW16 Deauther',
  'Dispositivo portatil con Ai-Thinker BW16 / RTL8720DN, pantalla TFT, tres botones y firmware instalado para laboratorio WiFi autorizado en 2.4 y 5 GHz.',
  'BWifiKill v0.2',
  'https://github.com/pepeangell5/BWifiKill-BW16-5Ghz',
  '/assets/optimized/bwifikill-bw16-720.6c79b32a47.webp',
  1500,
  0,
  true
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  firmware_name = excluded.firmware_name,
  repository_url = excluded.repository_url,
  image_url = excluded.image_url,
  price_mxn = excluded.price_mxn,
  updated_at = now();
