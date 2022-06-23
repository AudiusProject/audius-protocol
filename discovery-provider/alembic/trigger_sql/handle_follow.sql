create or replace function handle_follow() returns trigger as $$
declare
  new_follower_count int;
  milestone integer;
  delta int;
begin
  -- ensure rows for safety
  insert into aggregate_user (user_id) values (new.followee_user_id) on conflict do nothing;
  insert into aggregate_user (user_id) values (new.follower_user_id) on conflict do nothing;

  -- increment or decrement?
  if new.is_delete then
    delta := -1;
  else
    delta := 1;
  end if;

  update aggregate_user 
  set following_count = following_count + delta 
  where user_id = new.follower_user_id;

  update aggregate_user 
  set follower_count = follower_count + delta
  where user_id = new.followee_user_id
  returning follower_count into new_follower_count;

  -- create a milestone if applicable
  select new_follower_count into milestone where new_follower_count in (10, 25, 50, 100, 250, 500, 1000, 5000, 10000, 20000, 50000, 100000, 1000000);
  if milestone is not null and new.is_delete is false then
    insert into milestones 
      (id, name, threshold, blocknumber, slot, timestamp)
    values
      (new.followee_user_id, 'FOLLOWER_COUNT', milestone, new.blocknumber, new.slot, new.created_at)
    on conflict do nothing;
  end if;

  return null;
end; 
$$ language plpgsql;


drop trigger if exists on_follow on follows;
create trigger on_follow
  after insert on follows
  for each row execute procedure handle_follow();