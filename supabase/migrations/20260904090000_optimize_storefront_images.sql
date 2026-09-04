update public.products
set image_url = case slug
  when 'rf-kill-esp32-devkit'
    then '/assets/optimized/esp32-devkit-kit-720.9fe47e4cc5.webp'
  when 'rf-kill-esp32-c3-supermini'
    then '/assets/optimized/esp32-c3-supermini-kit-720.19cdd1160f.webp'
  else image_url
end
where slug in (
  'rf-kill-esp32-devkit',
  'rf-kill-esp32-c3-supermini'
);
