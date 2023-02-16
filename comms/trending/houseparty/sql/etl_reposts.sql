-- drop table if exists reposts;


create table if not exists reposts (
    blocknumber UInt32,
    user_id UInt32,
    repost_item_id UInt32,
    repost_type LowCardinality(String),
    created_at DateTime,
    sign Int8
)
ENGINE = CollapsingMergeTree(sign)
order by (user_id, created_at);


insert into reposts (
  blocknumber,
  user_id,
  repost_item_id,
  repost_type,
  created_at,
  sign
)
select
  blocknumber,
  user_id,
  repost_item_id,
  repost_type,
  created_at,
  if(is_delete, -1, 1)
from postgresql(testdb_data, table='reposts')
where is_current = true
  and blocknumber > (select max(blocknumber) from reposts)
;

-- optimize table reposts final;
