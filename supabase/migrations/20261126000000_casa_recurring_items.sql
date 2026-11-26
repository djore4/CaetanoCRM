-- Itens recorrentes: ao marcar como feito, voltam a "por fazer" em reappear_at.
alter table public.casa_list_items
  add column recur_kind text check (recur_kind in ('days', 'week', 'month')),
  add column recur_n int check (recur_n between 1 and 60),
  add column reappear_at timestamptz,
  add constraint casa_list_items_recur_both check ((recur_kind is null) = (recur_n is null));
