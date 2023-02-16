-- this activity table generalizes "activity" from: follows, reposts, saves.
-- maybe not strictly needed?  But I think conceptually it's kinda nice.


drop table if exists activity;

create table activity (
  user_id UInt32,
  action LowCardinality(String),
  object_type LowCardinality(String),
  object_id UInt32,
  created_at DateTime
)
ENGINE = MergeTree
partition by object_type  --  or should it be?   partition by toYYYYMM(created_at)
order by (user_id);


insert into activity

select
  user_id,
  'save',
  save_type,
  save_item_id,
  created_at
from saves

union all

select
  user_id,
  'repost',
  repost_type,
  repost_item_id,
  created_at
from reposts

union all

select
  follower_user_id,
  'follow',
  'user',
  followee_user_id,
  created_at
from follows

;

select 'activity', count(*) from activity;