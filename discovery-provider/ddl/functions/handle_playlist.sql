create or replace function handle_playlist() returns trigger as $$
declare
  track_owner_id int := 0;
  track_item json;
  subscriber_user_ids integer[];
  old_row RECORD;
  delta int := 0;
begin

  insert into aggregate_user (user_id) values (new.playlist_owner_id) on conflict do nothing;
  insert into aggregate_playlist (playlist_id, is_album) values (new.playlist_id, new.is_album) on conflict do nothing;

  with expanded as (
      select
          jsonb_array_elements(prev_records->'playlists') as playlist
      from
          revert_blocks
      where blocknumber = new.blocknumber
  )
  select
      (playlist->>'is_private')::boolean as is_private,
      (playlist->>'is_delete')::boolean as is_delete
  into old_row
  from
      expanded
  where
      (playlist->>'playlist_id')::int = new.playlist_id
  limit 1;

  delta := 0;
  if (new.is_delete = true and new.is_current = true) and (old_row.is_delete = false and old_row.is_private = false) then
    delta := -1;
  end if;

  if (old_row is null and new.is_private = false) or (old_row.is_private = true and new.is_private = false) then
    delta := 1;
  end if;

  if delta != 0 then
    if new.is_album then
      update aggregate_user
      set album_count = album_count + delta
      where user_id = new.playlist_owner_id;
    else
      update aggregate_user
      set playlist_count = playlist_count + delta
      where user_id = new.playlist_owner_id;
    end if;
  end if;
  -- Create playlist notification
  begin
    if new.is_private = FALSE AND
    new.is_delete = FALSE AND
    (
      new.created_at = new.updated_at OR
      old_row.is_private = TRUE
    )
    then
      select array(
        select subscriber_id
          from subscriptions
          where is_current and
          not is_delete and
          user_id=new.playlist_owner_id
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
          new.playlist_owner_id,
          'create:playlist_id:' || new.playlist_id,
          json_build_object('playlist_id', new.playlist_id, 'is_album', new.is_album)
        )
        on conflict do nothing;
      end if;
    end if;
	exception
    when others then
      raise warning 'An error occurred in %: %', tg_name, sqlerrm;
  end;

  begin
    if new.is_delete IS FALSE and new.is_private IS FALSE then
      for track_item IN select jsonb_array_elements from jsonb_array_elements(new.playlist_contents -> 'track_ids')
      loop
        if (track_item->>'time')::double precision::int >= extract(epoch from new.updated_at)::int then
          select owner_id into track_owner_id from tracks where is_current and track_id=(track_item->>'track')::int;
          if track_owner_id != new.playlist_owner_id then
            insert into notification
              (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
              values
              (
                new.blocknumber,
                ARRAY [track_owner_id],
                new.updated_at,
                'track_added_to_playlist',
                track_owner_id,
                'track_added_to_playlist:playlist_id:' || new.playlist_id || ':track_id:' || (track_item->>'track')::int,
                json_build_object('track_id', (track_item->>'track')::int, 'playlist_id', new.playlist_id, 'playlist_owner_id', new.playlist_owner_id)
              )
            on conflict do nothing;
          end if;
        end if;
      end loop;
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
  create trigger on_playlist
  after insert on playlists
  for each row execute procedure handle_playlist();
exception
  when others then null;
end $$;