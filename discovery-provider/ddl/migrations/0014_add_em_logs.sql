begin;

create table if not exists em_logs (
    entity_type text not null,
    blocknumber integer not null references blocks(number),
    txhash text not null,
    prev_record jsonb
);

create index idx_em_logs_blocknumber on em_logs(blocknumber);

commit;
