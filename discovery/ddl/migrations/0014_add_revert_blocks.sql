create table
    if not exists revert_blocks (
        blocknumber integer not null primary key references blocks (number) on delete cascade,
        prev_records jsonb not null
    );