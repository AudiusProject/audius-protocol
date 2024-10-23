begin;

create table if not exists core_blocks_indexing (
  blockhash character varying not null,
  parenthash character varying,
  chain_id text not null,
  height integer not null,
  constraint pk_chain_id_number primary key (chain_id, height)
);

create index idx_chain_id_number on core_blocks_indexing (chain_id, height);

commit;
