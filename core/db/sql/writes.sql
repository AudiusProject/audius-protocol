-- name: InsertKVStore :one
insert into kvstore (key, value, tx_hash)
values ($1, $2, $3)
returning id, key, value, tx_hash, created_at, updated_at;
