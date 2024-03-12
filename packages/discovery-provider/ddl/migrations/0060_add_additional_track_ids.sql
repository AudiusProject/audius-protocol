begin;
alter table tracks add column if not exists additional_ids jsonb;
create index idx_additional_ids on tracks using GIN (additional_ids);
commit;
