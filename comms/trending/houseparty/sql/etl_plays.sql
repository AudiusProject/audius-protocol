create table if not exists plays (
    id UInt32,
    user_id Nullable(UInt32),
    play_item_id UInt32,
    created_at DateTime, 
    updated_at DateTime
)
ENGINE = MergeTree
partition by toYYYYMM(created_at)
order by (play_item_id);


insert into plays
select 
    id,
    user_id,
    play_item_id,
    created_at,
    updated_at
from postgresql(testdb_data, table='plays')
where created_at > (select max(created_at) from plays)
;


-- reorient by user_id
create table if not exists plays_by_user (
    id UInt32,
    user_id UInt32,
    play_item_id UInt32,
    created_at DateTime, 
    updated_at DateTime
)
ENGINE = MergeTree
partition by toYYYYMM(created_at)
order by (user_id);

insert into plays_by_user select (*) from plays
where user_id is not null
  and created_at > (select max(created_at) from plays_by_user)
;

select count(*), 'plays' from plays;
