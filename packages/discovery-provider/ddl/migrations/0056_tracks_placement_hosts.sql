begin;

alter table tracks add column if not exists placement_hosts text;

commit;