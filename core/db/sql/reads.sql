-- name: GetKey :one
select * from core_kvstore where key = $1;

-- name: GetTx :one
select * from core_tx_results where tx_hash = $1 limit 1;
