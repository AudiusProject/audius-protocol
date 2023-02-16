-- drop table if exists saves;


create table if not exists saves (
    blocknumber UInt32,
    user_id UInt32,
    save_item_id UInt32,
    save_type LowCardinality(String),
    created_at DateTime,
    sign Int8
)
ENGINE = CollapsingMergeTree(sign)
order by (user_id, save_type, save_item_id);



insert into saves (
  blocknumber,
  user_id,
  save_item_id,
  save_type,
  created_at,
  sign
)
select
  blocknumber,
  user_id,
  save_item_id,
  save_type,
  created_at,
  if(is_delete, -1, 1)
from postgresql(testdb_data, table='saves')
where is_current = true
  and blocknumber > (select max(blocknumber) from saves);
;


-- optimize table saves final;
