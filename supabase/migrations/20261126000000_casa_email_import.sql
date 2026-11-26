-- Importação de faturas do email: fila de revisão (casa_import_items).
-- Nada entra em casa_expenses sem aprovação explícita na app.

alter table public.casa_expenses drop constraint if exists casa_expenses_source_check;
alter table public.casa_expenses
  add constraint casa_expenses_source_check check (source in ('manual', 'ia', 'email'));

create table public.casa_import_items (
  id uuid primary key default gen_random_uuid(),
  -- id da mensagem no Microsoft Graph + id do anexo ('' se a fatura vem no corpo do email)
  message_id text not null,
  attachment_id text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'ignored')),
  sender text,
  subject text,
  received_at timestamptz,
  -- resposta da extração: {is_invoice, supplier, category, amount, date, confidence}
  extracted jsonb not null default '{}'::jsonb,
  file_path text,
  expense_id uuid references public.casa_expenses (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (message_id, attachment_id)
);
create index casa_import_items_status_idx on public.casa_import_items (status);

alter table public.casa_import_items enable row level security;
create policy "casa: membros tudo" on public.casa_import_items
  for all to authenticated
  using ((select public.casa_is_member())) with check ((select public.casa_is_member()));
