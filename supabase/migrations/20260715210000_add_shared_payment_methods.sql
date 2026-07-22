create table if not exists finance.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_methods_name_check check (length(trim(name)) > 0)
);
create unique index if not exists payment_methods_user_name_unique_idx
on finance.payment_methods (user_id, lower(name));
create index if not exists payment_methods_user_id_idx
on finance.payment_methods(user_id);
alter table finance.incomes
add column if not exists payment_method_id uuid
references finance.payment_methods(id) on delete set null;
alter table finance.expenses
add column if not exists payment_method_id uuid
references finance.payment_methods(id) on delete set null;
create index if not exists incomes_payment_method_id_idx
on finance.incomes(payment_method_id);
create index if not exists expenses_payment_method_id_idx
on finance.expenses(payment_method_id);
drop trigger if exists set_payment_methods_updated_at on finance.payment_methods;
create trigger set_payment_methods_updated_at
before update on finance.payment_methods
for each row execute function finance.set_updated_at();
alter table finance.payment_methods enable row level security;
drop policy if exists "Users can view their payment methods" on finance.payment_methods;
create policy "Users can view their payment methods"
on finance.payment_methods for select
using (auth.uid() = user_id);
drop policy if exists "Users can insert their payment methods" on finance.payment_methods;
create policy "Users can insert their payment methods"
on finance.payment_methods for insert
with check (auth.uid() = user_id);
drop policy if exists "Users can update their payment methods" on finance.payment_methods;
create policy "Users can update their payment methods"
on finance.payment_methods for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
drop policy if exists "Users can delete their payment methods" on finance.payment_methods;
create policy "Users can delete their payment methods"
on finance.payment_methods for delete
using (auth.uid() = user_id);
grant select, insert, update, delete on finance.payment_methods to authenticated;
grant select on finance.payment_methods to service_role;
insert into finance.payment_methods (user_id, name)
select users.id, defaults.name
from auth.users as users
cross join (
  values ('Transferencia'), ('Tarjeta'), ('Efectivo')
) as defaults(name)
on conflict do nothing;
create or replace function finance.create_default_payment_methods()
returns trigger
language plpgsql
security definer
set search_path = finance
as $$
begin
  insert into finance.payment_methods (user_id, name)
  values
    (new.id, 'Transferencia'),
    (new.id, 'Tarjeta'),
    (new.id, 'Efectivo')
  on conflict do nothing;

  return new;
end;
$$;
drop trigger if exists on_finance_auth_user_created_payment_methods on auth.users;
create trigger on_finance_auth_user_created_payment_methods
after insert on auth.users
for each row execute function finance.create_default_payment_methods();
