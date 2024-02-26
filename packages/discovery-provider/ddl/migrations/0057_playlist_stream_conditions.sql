
begin;

-- add new columns
alter table playlists add column if not exists is_stream_gated boolean not null default false;
alter table playlists add column if not exists stream_conditions jsonb;

commit;
