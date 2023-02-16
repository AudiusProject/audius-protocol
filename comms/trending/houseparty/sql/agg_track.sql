drop table if exists agg_track;

create table agg_track (
  track_id UInt32,
  play_count UInt32,
  save_count UInt32,
  repost_count UInt32
)
ENGINE = MergeTree
order by (track_id);


insert into agg_track
with 

spins as (
  select 
    play_item_id as track_id,
    count(*) as spin_count
  from plays
  group by track_id
),

saves AS (  
  select
    save_item_id as track_id,
    count(*) as save_count
  from saves
  where save_type = 'track'
  group by track_id
),

reposts AS (
  select
    repost_item_id as track_id,
    count(*) as repost_count
  from reposts
  where repost_type = 'track'
  group by track_id
)

select
  t.track_id,
  coalesce(spin_count, 0) as play_count,
  coalesce(save_count, 0),
  coalesce(repost_count, 0)
from
  tracks t
  --join users u on owner_id = users.user_id
  left join spins on t.track_id = spins.track_id
  left join saves on t.track_id = saves.track_id
  left join reposts on t.track_id = reposts.track_id
;

