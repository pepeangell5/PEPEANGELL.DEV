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

  if nullif(trim(p_postal_code), '') is null then
    raise exception 'postal_code_required';
  end if;

  if nullif(trim(p_address_line_1), '') is null then
    raise exception 'address_required';
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

grant execute on function public.create_shop_order(
  uuid,
  integer,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to anon, authenticated;
