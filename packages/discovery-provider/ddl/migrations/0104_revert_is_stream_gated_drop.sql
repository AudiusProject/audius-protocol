begin;
alter table tracks disable trigger on_track;
alter table tracks disable trigger trg_tracks;
alter table playlists disable trigger on_playlist;
alter table playlists disable trigger trg_playlists;
alter table tracks
add column if not exists is_stream_gated boolean default false;
alter table tracks
add column if not exists is_download_gated boolean default false;
alter table playlists
add column if not exists is_stream_gated boolean default false;
update tracks
set is_stream_gated = true
where stream_conditions is not null;
update tracks
set is_download_gated = true
where download_conditions is not null;
update playlists
set is_stream_gated = true
where stream_conditions is not null;
alter table tracks enable trigger on_track;
alter table tracks enable trigger trg_tracks;
alter table playlists enable trigger on_playlist;
alter table playlists enable trigger trg_playlists;
commit;