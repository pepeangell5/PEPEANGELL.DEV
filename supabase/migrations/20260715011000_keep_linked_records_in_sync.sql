-- Keeps paid pending payments and their generated expenses as one logical record.
-- Deleting either side removes the linked record without touching unrelated data.
create or replace function finance.delete_linked_expense_from_fixed_expense()
returns trigger
language plpgsql
security definer
set search_path = finance
as $$
begin
  if old.expense_id is not null and pg_trigger_depth() = 1 then
    delete from finance.expenses
    where id = old.expense_id
      and user_id = old.user_id;
  end if;

  return old;
end;
$$;
create or replace function finance.delete_linked_fixed_expense_from_expense()
returns trigger
language plpgsql
security definer
set search_path = finance
as $$
begin
  if pg_trigger_depth() = 1 then
    delete from finance.fixed_expenses
    where expense_id = old.id
      and user_id = old.user_id;
  end if;

  return old;
end;
$$;
drop trigger if exists delete_linked_expense_from_fixed_expense
on finance.fixed_expenses;
create trigger delete_linked_expense_from_fixed_expense
before delete on finance.fixed_expenses
for each row execute function finance.delete_linked_expense_from_fixed_expense();
drop trigger if exists delete_linked_fixed_expense_from_expense
on finance.expenses;
create trigger delete_linked_fixed_expense_from_expense
before delete on finance.expenses
for each row execute function finance.delete_linked_fixed_expense_from_expense();
