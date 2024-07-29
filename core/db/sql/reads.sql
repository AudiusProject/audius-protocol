-- name: GetKey :one
select * from core_kvstore where key = $1;
