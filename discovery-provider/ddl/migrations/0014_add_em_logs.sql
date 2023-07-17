begin;

create table if not exists em_logs (
    entity_type text not null,
    entity_id integer not null,
    blocknumber integer not null references blocks(number),
    txhash text not null,
    prev_record jsonb not null
);

commit;
