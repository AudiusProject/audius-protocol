create or replace function handle_playlist_track() returns trigger as $$
declare
  playlist_record RECORD;
begin
  select * into playlist_record from playlists where playlist_id = new.playlist_id limit 1;

  -- Add notification for each purchaser
  if jsonb_exists(playlist_record.stream_conditions, 'usdc_purchase') then
    with album_purchasers as (
      select distinct buyer_user_id
        from usdc_purchases
        where content_id = new.playlist_id
        and content_type = 'album'
    )
      insert into notification
        (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
        select
          playlist_record.blocknumber,
          array [album_purchaser.buyer_user_id],
          new.updated_at,
          'track_added_to_purchased_album',
          album_purchaser.buyer_user_id,
          'track_added_to_purchased_album:playlist_id:' || new.playlist_id || ':track_id:' || new.track_id,
          json_build_object('track_id', new.track_id, 'playlist_id', new.playlist_id, 'playlist_owner_id', playlist_record.playlist_owner_id)
        from album_purchasers as album_purchaser;
  end if;
  
  return null;

exception
  when others then
    raise warning 'An error occurred in %: %', tg_name, sqlerrm;
    raise;

end;
$$ language plpgsql;


do $$ begin
  create trigger on_playlist_track
  after insert on playlist_tracks
  for each row execute procedure handle_playlist_track();
exception
  when others then null;
end $$;


