-- drop table if exists follows;


create table if not exists follows (
    blocknumber UInt32,
    follower_user_id UInt32,
    followee_user_id UInt32,
    created_at DateTime,
    sign Int8
)
ENGINE = CollapsingMergeTree(sign)
order by (follower_user_id, followee_user_id);



insert into follows (
  blocknumber,
  follower_user_id,
  followee_user_id,
  created_at,
  sign
)
select
  blocknumber,
  follower_user_id,
  followee_user_id,
  created_at,
  if(is_delete, -1, 1)
from postgresql(testdb_data, table='follows')
where is_current = true
  and blocknumber > (select max(blocknumber) from follows);
;

select count(*), 'follows' from follows;


-- optimize table follows final;

-- select follower_user_id, followee_user_id, count(*) as c 
-- from follows group by follower_user_id, followee_user_id having c > 1;
