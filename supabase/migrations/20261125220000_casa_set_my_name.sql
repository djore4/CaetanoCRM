-- Permite a cada membro alterar só o próprio nome (casa_members não tem políticas de escrita).
create or replace function public.casa_set_my_name(p_name text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.casa_members
     set name = left(btrim(p_name), 40)
   where email = lower((select auth.jwt() ->> 'email'))
     and length(btrim(p_name)) > 0;
$$;
revoke all on function public.casa_set_my_name(text) from public, anon;
grant execute on function public.casa_set_my_name(text) to authenticated;
