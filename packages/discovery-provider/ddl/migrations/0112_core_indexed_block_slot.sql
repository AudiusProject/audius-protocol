begin;

alter table core_indexed_blocks
add column if not exists plays_slot integer default 0;

commit;
