begin;

CREATE TABLE IF NOT EXISTS dashboard_wallet_users (
    wallet varchar not null,
    user_id integer not null,
    is_delete boolean not null default false,
    updated_at timestamp not null,
    created_at timestamp not null,
    blockhash varchar references blocks(blockhash),
    blocknumber integer references blocks(number),
    txhash varchar not null,
    primary key (user_id, wallet)
);

commit;