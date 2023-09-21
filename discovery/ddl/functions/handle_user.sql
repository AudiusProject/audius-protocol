create or replace function handle_user() returns trigger as $$
declare
begin
  insert into aggregate_user (user_id) values (new.user_id) on conflict do nothing;
  return null;

exception
  when others then
    raise warning 'An error occurred in %: %', tg_name, sqlerrm;
    raise;

end;
$$ language plpgsql;


do $$ begin
  create trigger on_user
  after insert on users
  for each row execute procedure handle_user();
exception
  when others then null;
end $$;
