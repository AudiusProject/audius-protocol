create or replace function track_is_public(track record) returns boolean as $$
begin
  return track.is_unlisted = false
     and track.is_available = true
     and track.is_delete = false
     and track.stem_of is null;
end
$$ LANGUAGE plpgsql;

create or replace function handle_track() returns trigger as $$
declare
  old_row tracks%ROWTYPE;
  is_new_upload boolean;
  new_val int;
  delta int := 0;
  parent_track_owner_id int;
  subscriber_user_ids int[];
begin
  insert into aggregate_track (track_id) values (new.track_id) on conflict do nothing;
  insert into aggregate_user (user_id) values (new.owner_id) on conflict do nothing;

  -- typical "track edits" will mark old row is_current = false and insert a new row
  -- so find the old_row here:
  select * into old_row from tracks where track_id = new.track_id and is_current = false order by blocknumber desc limit 1;

  -- but there are some places where we do an "in place" update (like update is_available to false)
  if TG_OP = 'UPDATE' then
    old_row := OLD;
  elsif new.created_at = new.updated_at AND TG_OP = 'INSERT' then
    is_new_upload := true;
  end if;


  -- update aggregate_user.track_count
  if old_row.track_id is not null then
    -- making existing track private: decrement
    if track_is_public(old_row) and not track_is_public(new) then
      delta := -1;
    end if;

    -- making existing track public: increment
    if not track_is_public(old_row) and track_is_public(new) then
      delta := 1;
    end if;
  elsif is_new_upload and track_is_public(new) then
    -- new public track added: increment
    delta := 1;
  end if;

  update aggregate_user
    set track_count = track_count + delta
  where user_id = new.owner_id
  ;

  -- If new track or newly unlisted track, create notification
  begin
    if delta = 1 AND new.is_playlist_upload = FALSE THEN
      select array(
        select subscriber_id
          from subscriptions
          where is_current and
          not is_delete and
          user_id=new.owner_id
      ) into subscriber_user_ids;

      if array_length(subscriber_user_ids, 1)	> 0 then
        insert into notification
          (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
        values
        (
          new.blocknumber,
          subscriber_user_ids,
          new.updated_at,
          'create',
          new.track_id,
          'create:track:user_id:' || new.owner_id,
          json_build_object('track_id', new.track_id)
        )
        on conflict do nothing;
      end if;
    end if;
	exception
    when others then
      raise warning 'An error occurred in %: %', tg_name, sqlerrm;
  end;

  -- If new remix or newly unlisted remix, create notification
  begin
    if delta = 1 AND new.remix_of is not null THEN
      select owner_id into parent_track_owner_id from tracks where is_current and track_id = (new.remix_of->'tracks'->0->>'parent_track_id')::int limit 1;
      if parent_track_owner_id is not null then
        insert into notification
        (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
        values
        (
          new.blocknumber,
          ARRAY [parent_track_owner_id],
          new.updated_at,
          'remix',
          new.owner_id,
          'remix:track:' || new.track_id || ':parent_track:' || (new.remix_of->'tracks'->0->>'parent_track_id')::int || ':blocknumber:' || new.blocknumber,
          json_build_object('track_id', new.track_id, 'parent_track_id', (new.remix_of->'tracks'->0->>'parent_track_id')::int)
        )
        on conflict do nothing;
      end if;
    end if;
	exception
    when others then
      raise warning 'An error occurred in %: %', tg_name, sqlerrm;
  end;

  return null;

exception
    when others then
      raise warning 'An error occurred in %: %', tg_name, sqlerrm;
      raise;

end;
$$ language plpgsql;



do $$ begin
  create trigger on_track
  after insert or update on tracks
  for each row execute procedure handle_track();
exception
  when others then null;
end $$;
