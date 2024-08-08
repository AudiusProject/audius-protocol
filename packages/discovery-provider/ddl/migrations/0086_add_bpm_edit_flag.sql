begin;

alter table tracks add column if not exists is_custom_bpm boolean default false;

commit;
