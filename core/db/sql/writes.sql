-- name: InsertKVStore :one
insert into core_kvstore (key, value, tx_hash)
values ($1, $2, $3)
on conflict (key) 
do update set
    value = excluded.value,
    tx_hash = excluded.tx_hash,
    updated_at = now()
returning id, key, value, tx_hash, created_at, updated_at;

-- name: UpsertAppState :exec
insert into core_app_state (block_height, app_hash)
values ($1, $2);

-- name: InsertRegisteredNode :exec
insert into core_validators(pub_key, endpoint, eth_address, comet_address, tx_hash)
values ($1, $2, $3, $4, $5);
