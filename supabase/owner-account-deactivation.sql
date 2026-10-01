-- Owner account deactivation security and Realtime migration.
-- Run after confirming the existing public.profiles and owner table schemas.

create or replace function public.current_owner_store_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select so.id
  from public.store_owners so
  join public.profiles p on p.id = so.profile_id
  where so.profile_id = auth.uid()
    and p.role = 'owner'
    and p.status = 'active'
  limit 1;
$$;

revoke all on function public.current_owner_store_id() from public;
grant execute on function public.current_owner_store_id() to authenticated;

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'owners can read own profile for access checks'
  ) then
    create policy "owners can read own profile for access checks"
      on public.profiles
      for select
      to authenticated
      using (id = auth.uid() and role = 'owner');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end
$$;

select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles', 'store_owners', 'customers', 'products',
    'credit_entries', 'credit_entry_items', 'payments'
  )
order by tablename, cmd, policyname;

select pubname, schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename = 'profiles';