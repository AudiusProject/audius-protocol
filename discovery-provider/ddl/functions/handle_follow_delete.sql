create or replace function handle_follow_delete() returns trigger as $$
declare
  delta int;
begin
  -- if we are deleteing a row that is_current=false do nothing
  if not old.is_current then
    return null;
  end if;

  if OLD.is_delete then
    delta := 1;
  else
    delta := -1;
  end if;

  update aggregate_user
  set following_count = following_count + delta
  where user_id = old.follower_user_id;

  update aggregate_user
  set follower_count = follower_count + delta
  where user_id = old.followee_user_id;

  return null;

exception
  when others then
    raise warning 'An error occurred in %: %', tg_name, sqlerrm;
    raise;

end;
$$ language plpgsql;

do $$ begin
  create trigger on_follow_delete
  after delete on follows
  for each row execute procedure handle_follow_delete();
exception
  when others then null;
end $$;
