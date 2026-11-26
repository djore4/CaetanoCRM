-- Recorrência mais expressiva: "a cada N dias/semanas/meses" ou "N vezes por semana/mês".
alter table public.casa_list_items
  add column recur_mode text check (recur_mode in ('every', 'times')),
  add column recur_unit text check (recur_unit in ('day', 'week', 'month'));

update public.casa_list_items set
  recur_mode = case recur_kind when 'days' then 'every' else 'times' end,
  recur_unit = case recur_kind when 'days' then 'day' when 'week' then 'week' else 'month' end
where recur_kind is not null;

alter table public.casa_list_items drop column recur_kind; -- remove também a constraint antiga

alter table public.casa_list_items
  add constraint casa_list_items_recur_all check (
    (recur_mode is null) = (recur_n is null) and (recur_unit is null) = (recur_n is null)
  ),
  add constraint casa_list_items_recur_times_unit check (recur_mode is distinct from 'times' or recur_unit <> 'day');
