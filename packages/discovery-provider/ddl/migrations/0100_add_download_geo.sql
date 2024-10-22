begin;

alter table track_downloads add column if not exists city character varying;
alter table track_downloads add column if not exists region character varying;
alter table track_downloads add column if not exists country character varying;

commit;