begin;

create index if not exists idx_chain_blockhash on core_indexed_blocks (blockhash);

commit;