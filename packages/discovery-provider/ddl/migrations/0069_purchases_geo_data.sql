begin;

alter table udsc_purchases add column if not exists city varchar;
alter table udsc_purchases add column if not exists region varchar;
alter table udsc_purchases add column if not exists country varchar;

commit;
