-- PepeAngell Labs shop migration for the existing pepeangell-shop schema.
-- This is designed to run after the initial SQL that created:
-- profiles, products, orders and order_events.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  firmware_name text,
  repository_url text,
  image_url text,
  price_mxn numeric(10, 2) not null default 0 check (price_mxn >= 0),
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  product_id uuid not null references public.products(id),
  quantity integer not null default 1 check (quantity > 0 and quantity <= 10),
  unit_price_mxn numeric(10, 2) not null check (unit_price_mxn >= 0),
  total_mxn numeric(10, 2) not null check (total_mxn >= 0),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  country text not null,
  state_or_province text not null,
  city text not null,
  postal_code text not null,
  address_line_1 text not null,
  address_line_2 text,
  customer_notes text,
  payment_status text not null default 'pending',
  shipping_status text not null default 'not_ready',
  carrier text,
  tracking_number text,
  shipped_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  details text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.orders
add column if not exists telegram_username text;

alter table public.orders
add column if not exists order_status text not null default 'new';

alter table public.orders
add column if not exists stock_released_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_order_status_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
    add constraint orders_order_status_check
    check (order_status in ('new', 'confirmed', 'in_progress', 'completed', 'cancelled'));
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create index if not exists products_active_idx on public.products (active, created_at);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_lookup_idx on public.orders (order_code, customer_email);
create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

create or replace function public.is_shop_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.role = 'admin'
  );
$$;

create or replace function public.is_shop_allowed_country(country_name text)
returns boolean
language sql
immutable
as $$
  select country_name = any (array[
    'Mexico',
    'México',
    'Estados Unidos',
    'Espana',
    'España',
    'Argentina',
    'Bolivia',
    'Chile',
    'Colombia',
    'Costa Rica',
    'Cuba',
    'Ecuador',
    'El Salvador',
    'Guatemala',
    'Honduras',
    'Nicaragua',
    'Panama',
    'Panamá',
    'Paraguay',
    'Peru',
    'Perú',
    'Puerto Rico',
    'Republica Dominicana',
    'República Dominicana',
    'Uruguay',
    'Venezuela'
  ]);
$$;

create or replace function public.create_shop_order(
  p_product_id uuid,
  p_quantity integer,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_telegram_username text,
  p_country text,
  p_state_or_province text,
  p_city text,
  p_postal_code text,
  p_address_line_1 text,
  p_address_line_2 text,
  p_customer_notes text
)
returns table (
  order_id uuid,
  public_code text,
  total_amount numeric,
  currency text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_quantity integer := greatest(coalesce(p_quantity, 1), 1);
  v_order_id uuid;
  v_order_code text;
  v_total numeric(10, 2);
  v_country text;
begin
  if v_quantity > 10 then
    raise exception 'quantity_too_high';
  end if;

  if nullif(trim(p_customer_name), '') is null then
    raise exception 'customer_name_required';
  end if;

  if nullif(trim(p_customer_email), '') is null then
    raise exception 'customer_email_required';
  end if;

  if nullif(trim(p_customer_phone), '') is null then
    raise exception 'customer_phone_required';
  end if;

  if not public.is_shop_allowed_country(p_country) then
    raise exception 'shipping_country_not_supported';
  end if;

  v_country := case p_country
    when 'Mexico' then 'México'
    when 'Espana' then 'España'
    when 'Panama' then 'Panamá'
    when 'Peru' then 'Perú'
    when 'Republica Dominicana' then 'República Dominicana'
    else p_country
  end;

  select *
  into v_product
  from public.products
  where id = p_product_id
    and active = true
  for update;

  if not found then
    raise exception 'product_not_available';
  end if;

  if v_product.stock < v_quantity then
    raise exception 'not_enough_stock';
  end if;

  v_total := v_product.price_mxn * v_quantity;

  insert into public.orders (
    product_id,
    quantity,
    unit_price_mxn,
    total_mxn,
    customer_name,
    customer_email,
    customer_phone,
    telegram_username,
    country,
    state_or_province,
    city,
    postal_code,
    address_line_1,
    address_line_2,
    customer_notes
  )
  values (
    v_product.id,
    v_quantity,
    v_product.price_mxn,
    v_total,
    trim(p_customer_name),
    trim(p_customer_email),
    trim(p_customer_phone),
    nullif(trim(coalesce(p_telegram_username, '')), ''),
    v_country,
    trim(p_state_or_province),
    trim(p_city),
    trim(p_postal_code),
    trim(p_address_line_1),
    nullif(trim(coalesce(p_address_line_2, '')), ''),
    nullif(trim(coalesce(p_customer_notes, '')), '')
  )
  returning id, order_code into v_order_id, v_order_code;

  update public.products
  set stock = stock - v_quantity
  where id = v_product.id;

  insert into public.order_events (order_id, event_type, details)
  values (
    v_order_id,
    'order_created',
    'Pedido recibido. Pendiente de pago por PayPal y confirmacion por Telegram.'
  );

  return query
  select v_order_id, v_order_code, v_total, 'MXN'::text;
end;
$$;

create or replace function public.track_shop_order(
  p_public_code text,
  p_customer_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_product public.products%rowtype;
  v_events jsonb;
begin
  select *
  into v_order
  from public.orders
  where upper(order_code) = upper(trim(p_public_code))
    and lower(customer_email) = lower(trim(p_customer_email));

  if not found then
    return null;
  end if;

  select *
  into v_product
  from public.products
  where id = v_order.product_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'event_type', event_type,
        'message', details,
        'created_at', created_at
      )
      order by created_at
    ),
    '[]'::jsonb
  )
  into v_events
  from public.order_events
  where order_id = v_order.id;

  return jsonb_build_object(
    'public_code', v_order.order_code,
    'customer_name', v_order.customer_name,
    'shipping_country', v_order.country,
    'payment_status', v_order.payment_status,
    'shipping_status', v_order.shipping_status,
    'overall_status', v_order.order_status,
    'carrier', v_order.carrier,
    'tracking_number', v_order.tracking_number,
    'shipped_at', v_order.shipped_at,
    'total_amount', v_order.total_mxn,
    'currency', 'MXN',
    'created_at', v_order.created_at,
    'updated_at', v_order.updated_at,
    'items', jsonb_build_array(
      jsonb_build_object(
        'product_name', coalesce(v_product.name, 'Producto'),
        'quantity', v_order.quantity,
        'unit_price', v_order.unit_price_mxn,
        'currency', 'MXN'
      )
    ),
    'events', v_events
  );
end;
$$;

create or replace function public.update_shop_order_status(
  p_order_id uuid,
  p_payment_status text,
  p_shipping_status text,
  p_order_status text,
  p_carrier text default null,
  p_tracking_number text default null,
  p_admin_notes text default null,
  p_event_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_message text;
  v_carrier text;
  v_tracking_number text;
  v_admin_notes text;
  v_order_status text;
  v_has_changes boolean;
begin
  if not public.is_shop_admin() then
    raise exception 'shop_admin_required';
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'order_not_found';
  end if;

  v_carrier := nullif(trim(coalesce(p_carrier, '')), '');
  v_tracking_number := nullif(trim(coalesce(p_tracking_number, '')), '');
  v_admin_notes := nullif(trim(coalesce(p_admin_notes, '')), '');

  if p_shipping_status = 'delivered' then
    v_order_status := 'completed';
  elsif p_order_status = 'completed' then
    raise exception 'completed_requires_delivered_shipping';
  else
    v_order_status := p_order_status;
  end if;

  v_has_changes :=
    v_order.payment_status is distinct from p_payment_status or
    v_order.shipping_status is distinct from p_shipping_status or
    v_order.order_status is distinct from v_order_status or
    v_order.carrier is distinct from v_carrier or
    v_order.tracking_number is distinct from v_tracking_number or
    v_order.admin_notes is distinct from v_admin_notes;

  update public.orders
  set payment_status = p_payment_status,
      shipping_status = p_shipping_status,
      order_status = v_order_status,
      carrier = v_carrier,
      tracking_number = v_tracking_number,
      admin_notes = v_admin_notes,
      shipped_at = case
        when p_shipping_status = 'shipped' and shipped_at is null then now()
        else shipped_at
      end
  where id = p_order_id;

  if (v_order_status = 'cancelled' or p_payment_status = 'cancelled' or p_shipping_status = 'cancelled')
    and v_order.stock_released_at is null then
    update public.products
    set stock = stock + v_order.quantity
    where id = v_order.product_id;

    update public.orders
    set stock_released_at = now()
    where id = p_order_id;

    insert into public.order_events (order_id, event_type, details, created_by)
    values (
      p_order_id,
      'stock_released',
      'Stock devuelto automaticamente por cancelacion del pedido.',
      auth.uid()
    );
  end if;

  v_message := nullif(trim(coalesce(p_event_message, '')), '');

  if v_message is null and not v_has_changes then
    return public.track_shop_order(v_order.order_code, v_order.customer_email);
  end if;

  if v_message is null then
    v_message := 'Estados actualizados: pago ' || p_payment_status || ', envio ' || p_shipping_status || ', pedido ' || v_order_status || '.';
  end if;

  insert into public.order_events (order_id, event_type, details, created_by)
  values (p_order_id, 'admin_update', v_message, auth.uid());

  return public.track_shop_order(v_order.order_code, v_order.customer_email);
end;
$$;

create or replace function public.delete_delivered_shop_order(
  p_order_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_shop_admin() then
    raise exception 'shop_admin_required';
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'order_not_found';
  end if;

  if v_order.shipping_status <> 'delivered' then
    raise exception 'delivered_order_required';
  end if;

  delete from public.orders
  where id = p_order_id;

  return jsonb_build_object(
    'deleted', true,
    'public_code', v_order.order_code
  );
end;
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;

grant select on public.products to anon, authenticated;
grant update (price_mxn, stock, active) on public.products to authenticated;
grant select on public.orders to authenticated;
grant select on public.order_events to authenticated;
grant select on public.profiles to authenticated;

drop policy if exists "Admins can read profiles" on public.profiles;
create policy "Admins can read profiles"
on public.profiles for select
to authenticated
using (public.is_shop_admin());

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
to anon, authenticated
using (active = true or public.is_shop_admin());

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
on public.products for all
to authenticated
using (public.is_shop_admin())
with check (public.is_shop_admin());

drop policy if exists "Admins can manage orders" on public.orders;
create policy "Admins can manage orders"
on public.orders for all
to authenticated
using (public.is_shop_admin())
with check (public.is_shop_admin());

drop policy if exists "Admins can read order events" on public.order_events;
create policy "Admins can read order events"
on public.order_events for select
to authenticated
using (public.is_shop_admin());

drop policy if exists "Admins can create order events" on public.order_events;
create policy "Admins can create order events"
on public.order_events for insert
to authenticated
with check (public.is_shop_admin());

grant execute on function public.create_shop_order(uuid, integer, text, text, text, text, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.track_shop_order(text, text) to anon, authenticated;
grant execute on function public.update_shop_order_status(uuid, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.delete_delivered_shop_order(uuid) to authenticated;
grant execute on function public.is_shop_admin() to authenticated;

insert into public.products (
  slug, name, description, firmware_name, repository_url, image_url
) values
(
  'rf-kill-esp32-devkit',
  'RF-KILL ESP32 DevKit Kit',
  'ESP32 DevKit de 30 pines con dos modulos nRF24L01+ PA+LNA, bateria, carga y firmware instalado.',
  'RF-KILL ESP32-WROOM DevKit V2.0',
  'https://github.com/pepeangell5/RF-KILL-ESP32-DEVKIT',
  '/assets/shop/esp32-devkit-kit.jpg'
),
(
  'rf-kill-esp32-c3-supermini',
  'RF-KILL ESP32-C3 Super Mini Kit',
  'ESP32-C3 Super Mini con dos modulos nRF24L01+ PA+LNA, bateria, carga y firmware instalado.',
  'RF-KILL ESP32-C3 SuperMini',
  'https://github.com/pepeangell5/RF-KILL',
  '/assets/shop/esp32-c3-supermini-kit.jpg'
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  firmware_name = excluded.firmware_name,
  repository_url = excluded.repository_url,
  image_url = excluded.image_url;

-- After Pepe signs in once, add his user id as admin if it is not already there:
-- insert into public.profiles (id, role) values ('AUTH_USER_UUID_HERE', 'admin');
