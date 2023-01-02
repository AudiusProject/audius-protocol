create or replace function handle_playlist() returns trigger as $$
declare
  track_owner_id int := 0;
  track_item json;
  subscriber_user_ids integer[];
begin

  insert into aggregate_user (user_id) values (new.playlist_owner_id) on conflict do nothing;
  insert into aggregate_playlist (playlist_id, is_album) values (new.playlist_id, new.is_album) on conflict do nothing;

  if new.is_album then
    update aggregate_user 
    set album_count = (
      select count(*)
      from playlists p
      where p.is_album IS TRUE
        AND p.is_current IS TRUE
        AND p.is_delete IS FALSE
        AND p.is_private IS FALSE
        AND p.playlist_owner_id = new.playlist_owner_id
    )
    where user_id = new.playlist_owner_id;
  else
    update aggregate_user 
    set playlist_count = (
      select count(*)
      from playlists p
      where p.is_album IS FALSE
        AND p.is_current IS TRUE
        AND p.is_delete IS FALSE
        AND p.is_private IS FALSE
        AND p.playlist_owner_id = new.playlist_owner_id
    )
    where user_id = new.playlist_owner_id;
  end if;

  -- Create playlist notification
  begin
    if new.created_at = new.updated_at AND 
    new.is_private = FALSE AND 
    new.is_delete = FALSE then
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
		when others then null;
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
                'track_added_to_playlist:playlist_id:' || new.playlist_id || ':track_id:' || (track_item->>'track')::int || ':blocknumber:' || new.blocknumber,
                json_build_object('track_id', (track_item->>'track')::int, 'playlist_id', new.playlist_id)
              )
            on conflict do nothing;
          end if;
        end if;
      end loop;
    end if;
   exception
     when others then null;
   end;

  return null;
end;
$$ language plpgsql;


do $$ begin
  create trigger on_playlist
  after insert on playlists
  for each row execute procedure handle_playlist();
exception
  when others then null;
end $$;


