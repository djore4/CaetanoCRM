-- Casa: despesas partilhadas, conta corrente e listas para 2 utilizadores.
-- Modelo de acesso: só quem tem linha em public.profiles (máx. 2) lê/escreve.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  slot text not null unique check (slot in ('a', 'b')),
  name text not null
);

create table public.expenses (
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
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index expenses_date_idx on public.expenses (date desc);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  from_slot text not null check (from_slot in ('a', 'b')),
  to_slot text not null check (to_slot in ('a', 'b')),
  amount numeric(10, 2) not null check (amount > 0),
  date date not null default current_date,
  created_at timestamptz not null default now(),
  check (from_slot <> to_slot)
);

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  emoji text not null default '📝',
  created_at timestamptz not null default now()
);

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  text text not null check (length(trim(text)) > 0),
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index list_items_list_idx on public.list_items (list_id);

-- ---------- acesso ----------
create function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()));
$$;
revoke all on function public.is_member() from public, anon;
grant execute on function public.is_member() to authenticated;

-- Os 2 primeiros utilizadores a registar-se ficam com os lugares A e B.
-- Quem vier depois não recebe perfil e, por isso, não vê nada (RLS).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  free_slot text;
begin
  select s into free_slot
  from (values ('a'), ('b')) as v(s)
  where not exists (select 1 from public.profiles p where p.slot = v.s)
  order by s
  limit 1;

  if free_slot is not null then
    insert into public.profiles (id, slot, name)
    values (
      new.id,
      free_slot,
      coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1))
    );
  end if;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.expenses enable row level security;
alter table public.settlements enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;

create policy "membros veem perfis" on public.profiles
  for select to authenticated using ((select public.is_member()));
create policy "cada um edita o seu nome" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "membros: tudo" on public.expenses
  for all to authenticated
  using ((select public.is_member())) with check ((select public.is_member()));
create policy "membros: tudo" on public.settlements
  for all to authenticated
  using ((select public.is_member())) with check ((select public.is_member()));
create policy "membros: tudo" on public.lists
  for all to authenticated
  using ((select public.is_member())) with check ((select public.is_member()));
create policy "membros: tudo" on public.list_items
  for all to authenticated
  using ((select public.is_member())) with check ((select public.is_member()));

-- ---------- faturas (ficheiros) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invoices', 'invoices', false, 20 * 1024 * 1024,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "membros: faturas" on storage.objects
  for all to authenticated
  using (bucket_id = 'invoices' and (select public.is_member()))
  with check (bucket_id = 'invoices' and (select public.is_member()));
