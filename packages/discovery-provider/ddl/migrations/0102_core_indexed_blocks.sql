begin;

create table if not exists core_indexed_blocks (
  blockhash character varying not null,
  parenthash character varying,
  chain_id text not null,
  height integer not null,
  constraint pk_chain_id_height primary key (chain_id, height)
);

create index idx_chain_id_height on core_indexed_blocks (chain_id, height);

commit;
