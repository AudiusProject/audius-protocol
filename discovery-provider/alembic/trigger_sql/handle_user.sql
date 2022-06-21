create or replace function handle_user() returns trigger as $$
declare
begin
  insert into aggregate_user (user_id) values (new.user_id) on conflict do nothing;
  return null;
end;
$$ language plpgsql;


drop trigger if exists on_user on users;
create trigger on_user
  after insert on users
  for each row execute procedure handle_user();