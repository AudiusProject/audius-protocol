begin;

CREATE TABLE IF NOT EXISTS dashboard_wallet_users (
    wallet varchar PRIMARY KEY,
    user_id integer not null,
    is_delete boolean not null default false,
    updated_at timestamp not null,
    created_at timestamp not null,
    blockhash varchar references blocks(blockhash),
    blocknumber integer references blocks(number),
    txhash varchar not null
);

commit;