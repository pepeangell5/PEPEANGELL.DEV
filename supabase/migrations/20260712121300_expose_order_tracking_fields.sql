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

grant execute on function public.track_shop_order(text, text) to anon, authenticated;

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

  v_has_changes :=
    v_order.payment_status is distinct from p_payment_status or
    v_order.shipping_status is distinct from p_shipping_status or
    v_order.order_status is distinct from p_order_status or
    v_order.carrier is distinct from v_carrier or
    v_order.tracking_number is distinct from v_tracking_number or
    v_order.admin_notes is distinct from v_admin_notes;

  update public.orders
  set payment_status = p_payment_status,
      shipping_status = p_shipping_status,
      order_status = p_order_status,
      carrier = v_carrier,
      tracking_number = v_tracking_number,
      admin_notes = v_admin_notes,
      shipped_at = case
        when p_shipping_status = 'shipped' and shipped_at is null then now()
        else shipped_at
      end
  where id = p_order_id;

  if (p_order_status = 'cancelled' or p_payment_status = 'cancelled' or p_shipping_status = 'cancelled')
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
    v_message := 'Estados actualizados: pago ' || p_payment_status || ', envio ' || p_shipping_status || ', pedido ' || p_order_status || '.';
  end if;

  insert into public.order_events (order_id, event_type, details, created_by)
  values (p_order_id, 'admin_update', v_message, auth.uid());

  return public.track_shop_order(v_order.order_code, v_order.customer_email);
end;
$$;

grant execute on function public.update_shop_order_status(uuid, text, text, text, text, text, text, text) to authenticated;
