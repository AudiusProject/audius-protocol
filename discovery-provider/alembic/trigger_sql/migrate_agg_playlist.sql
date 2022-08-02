-- nice:
-- https://www.postgresql.org/docs/current/sql-do.html
-- do $$ begin
--   drop materialized view if exists aggregate_playlist cascade;
-- exception
--   when others then null;
-- end $$;

-- create table if not exists aggregate_playlist (
--   playlist_id integer primary key,
--   is_album boolean,
--   repost_count integer default 0,
--   save_count integer default 0
-- );



insert into aggregate_playlist
select
  playlist_id,
  is_album,
  (
    select count(*) from reposts
    where 
      is_current = true
      and is_delete = false
      and (repost_type = 'playlist' or repost_type = 'album')
      and repost_item_id = playlist_id
  ) as repost_count,
  (
    select count(*) from saves
    where 
      is_current = true
      and is_delete = false
      and (save_type = 'playlist' or save_type = 'album')
      and save_item_id = playlist_id
  ) as save_count
from
  playlists
where
  is_current = true
  and is_delete = false
on conflict(playlist_id) do update set 
  repost_count = excluded.repost_count,
  save_count = excluded.save_count;



