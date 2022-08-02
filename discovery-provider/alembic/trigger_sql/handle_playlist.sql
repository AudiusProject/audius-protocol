create or replace function handle_playlist() returns trigger as $$
declare
  old_row playlists%rowtype;
  delta int := 0;
begin

  insert into aggregate_playlist (playlist_id, is_album) values (new.playlist_id, new.is_album) on conflict do nothing;

  -- for extra safety ensure agg_user
  -- this should just happen in handle_user
  insert into aggregate_user (user_id) values (new.playlist_owner_id) on conflict do nothing;

  select * into old_row from playlists where is_current = false and playlist_id = new.playlist_id order by blocknumber desc limit 1;

  -- should decrement
  if old_row.is_delete != new.is_delete then
    delta := -1;
  end if;

  if old_row is null and new.is_delete = false and new.is_private = false then
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


  return null;
end;
$$ language plpgsql;


drop trigger if exists on_playlist on playlists;
create trigger on_playlist
  after insert on playlists
  for each row execute procedure handle_playlist();