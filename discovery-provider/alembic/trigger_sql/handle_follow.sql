create or replace function handle_follow() returns trigger as $$
declare
  new_follower_count int;
  milestone integer;
begin
  insert into aggregate_user (user_id) values (new.followee_user_id) on conflict do nothing;
  insert into aggregate_user (user_id) values (new.follower_user_id) on conflict do nothing;

  update aggregate_user 
  set following_count = (
      select count(*) 
      from follows 
      where follower_user_id = new.follower_user_id 
        and is_current = true
        and is_delete = false
  )
  where user_id = new.follower_user_id;

  update aggregate_user 
  set follower_count = (
      select count(*) 
      from follows 
      where followee_user_id = new.followee_user_id 
        and is_current = true
        and is_delete = false
  )
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
      insert into notification
        (user_ids, type, specifier, blocknumber, timestamp, data)
        values
        (
          ARRAY [new.followee_user_id],
          'milestone_follower_count',
          'milestone:FOLLOWER_COUNT:id:' || new.followee_user_id || ':threshold:' || milestone,
          new.blocknumber,
          new.created_at,
          ('{"type":"FOLLOWER_COUNT", "user_id":' || new.followee_user_id ||',"threshold":' || milestone || '}')::json
        )
    on conflict do nothing;
  end if;

  begin
    -- create a notification for the followee
    if new.is_delete is false then
      insert into notification
      (blocknumber, user_ids, timestamp, type, specifier, data)
      values
      (
        new.blocknumber,
        ARRAY [new.followee_user_id],
        new.created_at,
        'follow',
        'follow:' || new.followee_user_id,
        json_build_object('followee_user_id', new.followee_user_id, 'follower_user_id', new.follower_user_id)
      )
      on conflict do nothing;
    end if;
	exception
		when others then null;
	end;

  return null;
end; 
$$ language plpgsql;

do $$ begin
  create trigger on_follow
  after insert on follows
  for each row execute procedure handle_follow();
exception
  when others then null;
end $$;
