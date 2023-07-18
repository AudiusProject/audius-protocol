begin;

create table if not exists em_logs (
    entity_type text not null,
    entity_id integer not null,
    blocknumber integer not null references blocks(number),
    txhash text not null,
    prev_record jsonb,
    primary key(txhash)
);

create index idx_em_logs_blocknumber on em_logs(blocknumber);

commit;
