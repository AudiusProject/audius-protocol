create or replace function handle_playlist() returns trigger as $$
declare
  old_row playlists%rowtype;
  delta int := 0;
  track_owner_id int := 0;
  track_item json;
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

  begin
    for track_item IN select jsonb_array_elements from jsonb_array_elements(new.playlist_contents -> 'track_ids')
    loop
      if (track_item->>'time')::double precision::int >= extract(epoch from new.updated_at)::int then
        select owner_id into track_owner_id from tracks where is_current and track_id=(track_item->>'track')::int;
        if track_owner_id != new.playlist_owner_id then
          raise notice 'inserting';
          insert into notification
            (blocknumber, user_ids, timestamp, type, specifier, metadata)
            values
            (
              new.blocknumber,
              ARRAY [track_owner_id],
              new.updated_at,
              'trackAddedToPlaylist',
              'trackAddedToPlaylist:playlistId:' || new.playlist_id || ':trackId:' || (track_item->>'track')::int || ':blocknumber:' || new.blocknumber,
              ('{ "track_id": ' || (track_item->>'track')::int || ',  "playlist_id": ' || new.playlist_id ||  '}')::json
            );
        end if;
      end if;
    end loop;
   exception
     when others then raise notice 'broke';
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


