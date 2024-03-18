begin;

lock table tracks in access exclusive mode;
alter table tracks drop column if exists download;

commit;
