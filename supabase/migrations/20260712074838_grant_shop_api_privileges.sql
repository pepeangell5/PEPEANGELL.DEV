grant select on public.products to anon, authenticated;
grant update (price_mxn, stock, active) on public.products to authenticated;
grant select on public.orders to authenticated;
grant select on public.order_events to authenticated;
grant select on public.profiles to authenticated;

grant execute on function public.create_shop_order(uuid, integer, text, text, text, text, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.track_shop_order(text, text) to anon, authenticated;
grant execute on function public.update_shop_order_status(uuid, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.is_shop_admin() to authenticated;
