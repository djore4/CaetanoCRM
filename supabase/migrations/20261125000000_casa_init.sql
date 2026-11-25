-- Casa: despesas partilhadas, conta corrente e listas para 2 utilizadores.
-- Tudo prefixado com "casa_" para conviver com outros sistemas no mesmo projeto.
-- Acesso: só quem estiver em public.casa_members (por email, máx. 2) lê/escreve.
-- NÃO cria triggers em auth.users nem toca em objetos que não sejam casa_*.

create table public.casa_members (
  email text primary key check (email = lower(email)),
  slot text not null unique check (slot in ('a', 'b')),
  name text not null
);

create table public.casa_expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null check (length(trim(description)) > 0),
  category text not null default 'outros',
  amount numeric(10, 2) not null check (amount > 0),
  date date not null,
  paid_by text not null check (paid_by in ('a', 'b')),
  -- % da despesa que cabe a quem pagou (50 = a meias)
  split_pct integer not null default 50 check (split_pct between 0 and 100),
  file_path text,
  source text not null default 'manual' check (source in ('manual', 'ia')),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index casa_expenses_date_idx on public.casa_expenses (date desc);

create table public.casa_settlements (
  id uuid primary key default gen_random_uuid(),
  from_slot text not null check (from_slot in ('a', 'b')),
  to_slot text not null check (to_slot in ('a', 'b')),
  amount numeric(10, 2) not null check (amount > 0),
  date date not null default current_date,
  created_at timestamptz not null default now(),
  check (from_slot <> to_slot)
);

create table public.casa_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  emoji text not null default '📝',
  created_at timestamptz not null default now()
);

create table public.casa_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.casa_lists (id) on delete cascade,
  text text not null check (length(trim(text)) > 0),
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index casa_list_items_list_idx on public.casa_list_items (list_id);

-- ---------- acesso ----------
create function public.casa_is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.casa_members
    where email = lower((select auth.jwt() ->> 'email'))
  );
$$;
revoke all on function public.casa_is_member() from public, anon;
grant execute on function public.casa_is_member() to authenticated;

-- ---------- RLS ----------
alter table public.casa_members enable row level security;
alter table public.casa_expenses enable row level security;
alter table public.casa_settlements enable row level security;
alter table public.casa_lists enable row level security;
alter table public.casa_list_items enable row level security;

-- membros só se gerem pelo SQL editor / service role: não há políticas de escrita
create policy "casa: membros veem membros" on public.casa_members
  for select to authenticated using ((select public.casa_is_member()));

create policy "casa: membros tudo" on public.casa_expenses
  for all to authenticated
  using ((select public.casa_is_member())) with check ((select public.casa_is_member()));
create policy "casa: membros tudo" on public.casa_settlements
  for all to authenticated
  using ((select public.casa_is_member())) with check ((select public.casa_is_member()));
create policy "casa: membros tudo" on public.casa_lists
  for all to authenticated
  using ((select public.casa_is_member())) with check ((select public.casa_is_member()));
create policy "casa: membros tudo" on public.casa_list_items
  for all to authenticated
  using ((select public.casa_is_member())) with check ((select public.casa_is_member()));

-- ---------- faturas (ficheiros) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'casa-invoices', 'casa-invoices', false, 20 * 1024 * 1024,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "casa: faturas" on storage.objects
  for all to authenticated
  using (bucket_id = 'casa-invoices' and (select public.casa_is_member()))
  with check (bucket_id = 'casa-invoices' and (select public.casa_is_member()));
