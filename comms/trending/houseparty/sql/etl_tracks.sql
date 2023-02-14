drop table if exists tracks;


create table if not exists tracks (
    track_id UInt32,
    owner_id UInt32,
    route_id String,
    is_unlisted Boolean,
    title String,
    tags String,
    genre LowCardinality(String),
    mood LowCardinality(String),
    track_segments String,
    created_at DateTime, 
    updated_at DateTime
)
ENGINE = MergeTree
order by (track_id);




insert into tracks 
select 
    track_id,
    owner_id,
    route_id,
    is_unlisted,
    title,
    COALESCE(tags, ''),
    COALESCE(genre, ''),
    COALESCE(mood, ''),
    track_segments,
    created_at,
    updated_at
from postgresql(testdb_data, table='tracks')
where is_current = true 
and is_delete = false
and is_unlisted = false;

select count(*), 'tracks' from tracks;