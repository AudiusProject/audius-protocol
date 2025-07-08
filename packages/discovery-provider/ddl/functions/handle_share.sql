create or replace function handle_share() returns trigger as $$
begin
  -- Ensure aggregate_user exists for this user
  insert into aggregate_user (user_id) values (new.user_id) on conflict do nothing;

  if new.share_type = 'track' then
    -- Ensure aggregate_track exists for this track
    insert into aggregate_track (track_id) values (new.share_item_id) on conflict do nothing;
  else
    -- Ensure aggregate_playlist exists for this playlist
    insert into aggregate_playlist (playlist_id, is_album)
    select p.playlist_id, p.is_album
    from playlists p
    where p.playlist_id = new.share_item_id
    and p.is_current
    on conflict do nothing;
  end if;

  -- Update aggregate statistics for tracks
  if new.share_type = 'track' then
    update aggregate_track
    set share_count = (
      select count(*)
      from shares s
      where s.share_type = new.share_type
        and s.share_item_id = new.share_item_id
    )
    where track_id = new.share_item_id;

    -- Update user's track share count
    update aggregate_user
    set track_share_count = (
      select count(*)
      from shares s
      where s.user_id = new.user_id
        and s.share_type = new.share_type
    )
    where user_id = new.user_id;
  else
    -- Update aggregate statistics for playlists/albums
    update aggregate_playlist
    set share_count = (
      select count(*)
      from shares s
      where s.share_type = new.share_type
        and s.share_item_id = new.share_item_id
    )
    where playlist_id = new.share_item_id;
  end if;

  return null;

exception
    when others then
      raise warning 'An error occurred in %: %', tg_name, sqlerrm;
      return null;
end;
$$ language plpgsql;


do $$ begin
  create trigger on_share
  after insert on shares
  for each row execute procedure handle_share();
exception
  when others then null;
end $$;