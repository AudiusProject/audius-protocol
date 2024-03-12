begin;

lock table tracks in access exclusive mode;
alter table tracks drop column download;

commit;
