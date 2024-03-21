begin;

alter table tracks add column if not exists ddex_app varchar;
alter table playlists add column if not exists ddex_app varchar;

commit;
