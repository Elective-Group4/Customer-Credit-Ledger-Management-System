-- CCLMS account-scoped themes and safe customer/credit mutations.
-- Run in the Supabase SQL Editor after the existing customer schema/functions.

alter table public.profiles
  add column if not exists theme_preference text not null default 'light';

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_theme_select_own'
  ) then
    create policy profiles_theme_select_own
      on public.profiles for select to authenticated
      using (id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_theme_update_own'
  ) then
    create policy profiles_theme_update_own
      on public.profiles for update to authenticated
      using (id = auth.uid())
      with check (id = auth.uid());
  end if;
end
$$;

alter table public.profiles
  drop constraint if exists profiles_theme_preference_check;

alter table public.profiles
  add constraint profiles_theme_preference_check
  check (theme_preference in ('light', 'dark', 'system'));

create or replace function public.set_my_theme_preference(p_theme_preference text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_theme_preference not in ('light', 'dark', 'system') then
    raise exception 'Invalid theme preference.' using errcode = '22023';
  end if;

  update public.profiles
  set theme_preference = p_theme_preference
  where id = auth.uid();

  if not found then
    raise exception 'Profile not found.' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.set_my_theme_preference(text) from public;
grant execute on function public.set_my_theme_preference(text) to authenticated;

alter table public.customers
  add column if not exists deleted_at timestamptz;

create table if not exists public.customer_deletion_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.store_owners(id),
  customer_code text not null,
  customer_name text not null,
  deleted_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists customer_deletion_events_store_created_idx
  on public.customer_deletion_events (store_id, created_at desc);

alter table public.customer_deletion_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'customer_deletion_events'
      and policyname = 'customer_deletion_events_owner_select'
  ) then
    create policy customer_deletion_events_owner_select
      on public.customer_deletion_events
      for select to authenticated
      using (store_id = public.current_owner_store_id());
  end if;
end
$$;

grant select on table public.customer_deletion_events to authenticated;

create or replace view public.owner_customer_balances
with (security_invoker = true)
as
select
  c.id,
  c.store_id,
  c.customer_code,
  c.name,
  c.phone_number,
  c.address,
  c.status,
  coalesce(credits.total_credit, 0)::numeric(12,2) -
    coalesce(payments.total_paid, 0)::numeric(12,2) as balance,
  c.created_at,
  c.updated_at
from public.customers c
left join (
  select customer_id, sum(total_amount) as total_credit
  from public.credit_entries
  group by customer_id
) credits on credits.customer_id = c.id
left join (
  select customer_id, sum(amount) as total_paid
  from public.payments
  group by customer_id
) payments on payments.customer_id = c.id
where c.deleted_at is null;

drop function if exists public.delete_customer_if_settled(uuid);

create function public.delete_customer_if_settled(p_customer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_store_id uuid;
  customer_store_id uuid;
  customer_code text;
  customer_name text;
  customer_balance numeric;
begin
  owner_store_id := public.current_owner_store_id();

  if owner_store_id is null then
    raise exception 'Not authorized to delete this customer.' using errcode = '42501';
  end if;

  select c.store_id
       , c.customer_code
       , c.name
    into customer_store_id
       , customer_code
       , customer_name
  from public.customers c
  where c.id = p_customer_id
    and c.deleted_at is null
  for update;

  if customer_store_id is null or customer_store_id <> owner_store_id then
    raise exception 'Customer not found.' using errcode = '42501';
  end if;

  select coalesce((select sum(total_amount) from public.credit_entries where customer_id = p_customer_id), 0)
       - coalesce((select sum(amount) from public.payments where customer_id = p_customer_id), 0)
    into customer_balance;

  if customer_balance <> 0 then
    raise exception 'Cannot delete customer. Please settle the outstanding balance first.' using errcode = '23514';
  end if;

  insert into public.customer_deletion_events (
    store_id,
    customer_code,
    customer_name,
    deleted_by
  ) values (
    customer_store_id,
    customer_code,
    customer_name,
    auth.uid()
  );

  update public.customers
  set deleted_at = now(), updated_at = now()
  where id = p_customer_id
    and store_id = owner_store_id;
end;
$$;

revoke all on function public.delete_customer_if_settled(uuid) from public;
grant execute on function public.delete_customer_if_settled(uuid) to authenticated;

create or replace function public.reject_credit_for_inactive_customer()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.customers c
    where c.id = new.customer_id
      and c.store_id = new.store_id
      and c.status = 'active'
      and c.deleted_at is null
  ) then
    raise exception 'Cannot add credit. This customer is inactive.' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists credit_entries_require_active_customer on public.credit_entries;
create trigger credit_entries_require_active_customer
before insert on public.credit_entries
for each row execute function public.reject_credit_for_inactive_customer();