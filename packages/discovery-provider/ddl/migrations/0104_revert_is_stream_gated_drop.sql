begin;

alter table tracks add column if not exists is_stream_gated boolean default false;
alter table tracks add column if not exists is_download_gated boolean default false;
alter table playlists add column if not exists is_stream_gated boolean default false;

update tracks set is_stream_gated = stream_conditions is not null;
update tracks set is_download_gated = download_conditions is not null;
update playlists set is_stream_gated = stream_conditions is not null;

commit;