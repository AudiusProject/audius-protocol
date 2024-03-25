begin;

alter table tracks add column if not exists artists jsonb[];
alter table tracks add column if not exists resource_contributors jsonb[];
alter table tracks add column if not exists indirect_resource_contributors jsonb[];
alter table tracks add column if not exists rights_controller jsonb;
alter table tracks add column if not exists copyright_line jsonb;
alter table tracks add column if not exists producer_copyright_line jsonb;
alter table tracks add column if not exists parental_warning_type varchar;

alter table playlists add column if not exists artists jsonb[];
alter table playlists add column if not exists copyright_line jsonb;
alter table playlists add column if not exists producer_copyright_line jsonb;
alter table playlists add column if not exists parental_warning_type varchar;

commit;
