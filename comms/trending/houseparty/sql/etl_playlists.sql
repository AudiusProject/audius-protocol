drop table if exists playlists;




create table if not exists playlists (
  playlist_id UInt32,
  playlist_owner_id UInt32,
  playlist_name String,
  playlist_contents String,
  is_album Boolean,
  created_at DateTime, 
  updated_at DateTime,
  last_added_to Nullable(DateTime)
)
ENGINE = MergeTree
order by (playlist_owner_id, created_at);


insert into playlists 
select 
    playlist_id,
    playlist_owner_id,
    playlist_name,
    playlist_contents,
    is_album,
    created_at,
    updated_at,
    last_added_to
from postgresql(testdb_data, table='playlists')
where is_current = true
  and is_delete = false
  and is_private = false;



--- playlist_tracks


drop table if exists playlist_tracks;

create table if not exists playlist_tracks (
  playlist_id UInt32,
  track_id UInt32,
  created_at DateTime
)
ENGINE = MergeTree
order by (playlist_id);
;


insert into playlist_tracks
select 
  playlist_id, 
  JSONExtractUInt(arrayJoin(JSONExtractArrayRaw(playlist_contents, 'track_ids')), 'track') as track_id,
  JSONExtractUInt(arrayJoin(JSONExtractArrayRaw(playlist_contents, 'track_ids')), 'time') as created_at
from postgresql(testdb_data, table='playlists')
where is_current = true
  and is_delete = false
  and is_private = false
  ;
