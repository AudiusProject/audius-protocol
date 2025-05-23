create or replace function handle_event() returns trigger as $$
declare
  notified_user_id int;
  owner_user_id int;
  track_is_public boolean;
begin
  -- Only proceed if this is a remix contest event
  if new.event_type = 'remix_contest' and new.is_deleted = false then
    -- Get the owner of the track and check if it's public
    select owner_id, not is_unlisted into owner_user_id, track_is_public 
    from tracks 
    where is_current and track_id = new.entity_id 
    limit 1;

    -- Only create notifications if the track is public
    if track_is_public then
      -- For each follower of the event creator and each user who favorited the track
      -- Using UNION to ensure we don't get duplicate user_ids
      for notified_user_id in
        select distinct user_id
        from (
          -- Get followers
          select f.follower_user_id as user_id
          from follows f
          where f.followee_user_id = new.user_id
            and f.is_current = true
            and f.is_delete = false
          union
          -- Get users who favorited the track
          select s.user_id
          from saves s
          where s.save_item_id = new.entity_id
            and s.save_type = 'track'
            and s.is_current = true
            and s.is_delete = false
        ) as users_to_notify
      loop
        -- Create a notification for this user
        insert into notification
          (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
        values
          (
            new.blocknumber,
            ARRAY[notified_user_id],
            new.created_at,
            'fan_remix_contest_started',
            notified_user_id,
            'fan_remix_contest_started:' || new.entity_id || ':user:' || new.user_id,
            json_build_object(
              'entity_user_id', owner_user_id,
              'entity_id', new.entity_id
            )
          )
        on conflict do nothing;
      end loop;
    end if;
  end if;

  return null;

exception
  when others then
    raise warning 'An error occurred in %: %', tg_name, sqlerrm;
    return null;
end;
$$ language plpgsql;


do $$ begin
  create trigger on_event
    after insert on events
    for each row execute procedure handle_event();
exception
  when others then null;
end $$; 
