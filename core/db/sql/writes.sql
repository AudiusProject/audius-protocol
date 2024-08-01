-- name: InsertKVStore :one
insert into core_kvstore (key, value, tx_hash)
values ($1, $2, $3)
on conflict (key) 
do update set
    value = excluded.value,
    tx_hash = excluded.tx_hash,
    updated_at = now()
returning id, key, value, tx_hash, created_at, updated_at;
