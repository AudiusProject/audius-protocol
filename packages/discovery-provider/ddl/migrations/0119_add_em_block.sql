begin;

alter table core_indexed_blocks
add column if not exists em_block integer;

commit;
