-- CCLMS customer ID and owner-scope migration
-- Run this in the Supabase SQL Editor after confirming the existing profiles/store_owners schema.

create extension if not exists pgcrypto;

create or replace function public.generate_customer_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
begin
  loop
    new_code := 'CUST-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

    if not exists (
      select 1
      from public.customers
      where customer_code = new_code
    ) then
      return new_code;
    end if;
  end loop;
end;
$$;

revoke all on function public.generate_customer_code() from public;
grant execute on function public.generate_customer_code() to authenticated;

alter table public.customers
  alter column customer_code
  set default public.generate_customer_code();

-- A duplicate must be resolved before the global constraint can be created.
do $$
begin
  if exists (
    select customer_code
    from public.customers
    group by customer_code
    having count(*) > 1
  ) then
    raise exception 'Duplicate customer_code values exist. Resolve them before applying the unique constraint.';
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint constraint_row
    where constraint_row.conrelid = 'public.customers'::regclass
      and constraint_row.contype = 'u'
      and constraint_row.conkey = array[
        (select attnum
         from pg_attribute
         where attrelid = 'public.customers'::regclass
           and attname = 'customer_code')::smallint
      ]
  ) then
    alter table public.customers
      add constraint customers_customer_code_unique unique (customer_code);
  end if;
end
$$;

-- Keep the existing owner/store architecture. Existing customer policies are left intact.
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
  limit 1;
$$;

revoke all on function public.current_owner_store_id() from public;
grant execute on function public.current_owner_store_id() to authenticated;

alter table public.customers enable row level security;

-- Add a policy only when no policy currently exists for that operation.
-- This avoids duplicate policies and avoids changing an existing working policy.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'customers' and cmd = 'SELECT'
  ) then
    create policy customers_owner_select on public.customers
      for select to authenticated
      using (store_id = public.current_owner_store_id());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'customers' and cmd = 'INSERT'
  ) then
    create policy customers_owner_insert on public.customers
      for insert to authenticated
      with check (store_id = public.current_owner_store_id());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'customers' and cmd = 'UPDATE'
  ) then
    create policy customers_owner_update on public.customers
      for update to authenticated
      using (store_id = public.current_owner_store_id())
      with check (store_id = public.current_owner_store_id());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'customers' and cmd = 'DELETE'
  ) then
    create policy customers_owner_delete on public.customers
      for delete to authenticated
      using (store_id = public.current_owner_store_id());
  end if;
end
$$;

-- Verification: this should return one row with true.
select exists (
  select 1
  from pg_constraint constraint_row
  where constraint_row.conrelid = 'public.customers'::regclass
    and constraint_row.contype = 'u'
    and constraint_row.conkey = array[
      (select attnum
       from pg_attribute
       where attrelid = 'public.customers'::regclass
         and attname = 'customer_code')::smallint
    ]
) as customer_code_is_unique;

-- Verification: inspect the effective customer policies. Every policy must enforce
-- the current owner's store_id; remove or repair any unrelated broad policy.
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'customers'
order by cmd, policyname;
