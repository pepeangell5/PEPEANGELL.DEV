-- Reuse existing shop administrators without touching shop data.
update auth.users as user_account
set raw_app_meta_data = coalesce(user_account.raw_app_meta_data, '{}'::jsonb)
  || '{"role":"admin"}'::jsonb
from public.profiles as shop_profile
where shop_profile.id = user_account.id
  and shop_profile.role = 'admin';
insert into finance.profiles (id, full_name, username, role)
select
  user_account.id,
  coalesce(
    user_account.raw_user_meta_data->>'full_name',
    user_account.raw_user_meta_data->>'username',
    user_account.email
  ),
  nullif(user_account.raw_user_meta_data->>'username', ''),
  'admin'
from auth.users as user_account
join public.profiles as shop_profile on shop_profile.id = user_account.id
where shop_profile.role = 'admin'
on conflict (id) do update set role = 'admin';
insert into finance.allocation_buckets (
  user_id,
  name,
  percentage,
  color,
  sort_order
)
select
  shop_profile.id,
  defaults.name,
  defaults.percentage,
  defaults.color,
  defaults.sort_order
from public.profiles as shop_profile
cross join (
  values
    ('Ahorro', 25::numeric, '#22c55e', 1),
    ('Reinversión', 15::numeric, '#16a34a', 2),
    ('Operación del negocio', 10::numeric, '#15803d', 3),
    ('Gastos fijos personales', 30::numeric, '#6b7280', 4),
    ('Gastos personales', 15::numeric, '#9ca3af', 5),
    ('Oportunidad / Imprevistos', 5::numeric, '#84cc16', 6)
) as defaults(name, percentage, color, sort_order)
where shop_profile.role = 'admin'
on conflict (user_id, name) do nothing;
insert into finance.categories (user_id, allocation_bucket_id, name, color)
select
  shop_profile.id,
  bucket.id,
  defaults.category_name,
  defaults.color
from public.profiles as shop_profile
cross join (
  values
    ('Operación del negocio', 'Operación del negocio', '#15803d'),
    ('Gastos fijos personales', 'Gastos fijos personales', '#6b7280'),
    ('Gastos personales', 'Gastos personales', '#9ca3af'),
    ('Oportunidad / Imprevistos', 'Oportunidad / Imprevistos', '#84cc16'),
    ('Ahorro', 'Ahorro', '#22c55e'),
    ('Reinversión', 'Reinversión', '#16a34a')
) as defaults(bucket_name, category_name, color)
join finance.allocation_buckets as bucket
  on bucket.user_id = shop_profile.id
 and bucket.name = defaults.bucket_name
where shop_profile.role = 'admin'
on conflict (user_id, name) do nothing;
insert into finance.income_categories (user_id, name, color)
select
  shop_profile.id,
  defaults.name,
  defaults.color
from public.profiles as shop_profile
cross join (
  values
    ('Sueldo', '#22c55e'),
    ('Ventas', '#10b981'),
    ('Proyectos', '#14b8a6'),
    ('Reembolsos', '#0ea5e9'),
    ('Rendimientos', '#6366f1'),
    ('Extras', '#f59e0b')
) as defaults(name, color)
where shop_profile.role = 'admin'
on conflict (user_id, name) do nothing;
