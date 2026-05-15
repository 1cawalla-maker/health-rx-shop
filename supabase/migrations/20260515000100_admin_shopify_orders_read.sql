-- Allow admins to review Shopify orders and supplier fulfilment documents.
-- Patients can still only read their own orders/items; order PDFs remain hidden from patients.

drop policy if exists shopify_orders_select_admin on public.shopify_orders;
create policy shopify_orders_select_admin
  on public.shopify_orders
  for select
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists shopify_order_items_select_admin on public.shopify_order_items;
create policy shopify_order_items_select_admin
  on public.shopify_order_items
  for select
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists order_pdfs_select_admin on public.order_pdfs;
create policy order_pdfs_select_admin
  on public.order_pdfs
  for select
  using (public.has_role(auth.uid(), 'admin'));
