drop table if exists users;


create table if not exists users (
    user_id UInt32,
    handle String,
    name String,
    location String,
    creator_node_endpoint String,
    created_at DateTime, 
    updated_at DateTime
)
ENGINE = MergeTree
order by (user_id);



insert into users 
select 
  user_id,
  COALESCE(handle, ''),
  COALESCE(name, ''),
  COALESCE(location, ''),
  COALESCE(creator_node_endpoint, ''),
  created_at,
  updated_at
from postgresql(sandbox3, table='users')
where is_current = true;