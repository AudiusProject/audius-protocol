create or replace function handle_playlist() returns trigger as $$
begin

  insert into aggregate_playlist (playlist_id, is_album) values (new.playlist_id, new.is_album) on conflict do nothing;

  -- for extra safety ensure agg_user
  -- this should just happen in handle_user
  insert into aggregate_user (user_id) values (new.playlist_owner_id) on conflict do nothing;

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


