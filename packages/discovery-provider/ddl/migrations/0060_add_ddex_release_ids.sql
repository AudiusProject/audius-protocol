begin;

alter table tracks add column if not exists ddex_release_ids jsonb;
create index idx_ddex_release_ids on tracks using GIN (ddex_release_ids);

alter table playlists add column if not exists ddex_release_ids jsonb;
create index idx_ddex_release_ids on playlists using GIN (ddex_release_ids);

commit;
