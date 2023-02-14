-- this is kinda weird because ClickHouse doesn't
-- currently support coorelated subqueries...
-- tho it sounds like it might this year?
-- https://github.com/ClickHouse/ClickHouse/issues/6697

drop table if exists agg_user;


create table agg_user (
  user_id UInt32,
  handle String,
  save_count UInt32,
  repost_count UInt32,
  follower_count UInt32,
  following_count UInt32,
  track_count UInt32,
  playlist_count UInt32,
  listen_count UInt32
)
ENGINE = MergeTree
order by (user_id);



insert into agg_user
WITH 

saves AS (  
  select
    user_id,
    count(saves.user_id) as save_count
  from saves
  group by user_id
),

reposts AS (
  select
    user_id,
    count(*) as repost_count
  from reposts
  group by user_id
),

followers AS (
  select
    followee_user_id as user_id,
    count(*) as follower_count
  from follows
  group by followee_user_id
),

following AS (
  select
    follower_user_id as user_id,
    count(*) as following_count
  from follows
  group by follower_user_id
),

tracks AS (
  select
    owner_id as user_id,
    count(*) as track_count
  from tracks
  -- filter is_unlisted
  group by user_id
),

playlists AS (
  select
    playlist_owner_id as user_id,
    count(*) as playlist_count
  from playlists
  group by user_id
),

listens as (
  select
    user_id,
    count(*) as listen_count
  from plays
  group by user_id
)


select
  u.user_id,
  handle,
  coalesce(save_count, 0),
  coalesce(repost_count, 0),
  coalesce(follower_count, 0),
  coalesce(following_count, 0),
  coalesce(track_count, 0),
  coalesce(playlist_count, 0),
  coalesce(listen_count, 0)
from users u
left join saves on u.user_id = saves.user_id
left join reposts on u.user_id = reposts.user_id
left join followers on u.user_id = followers.user_id
left join following on u.user_id = following.user_id
left join tracks on u.user_id = tracks.user_id
left join playlists on u.user_id = playlists.user_id
left join listens on u.user_id = listens.user_id
;


select 'agg_user', count(*) from agg_user;