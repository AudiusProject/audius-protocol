begin;

alter table tracks add column if not exists is_custom_musical_key boolean default false;

commit;
