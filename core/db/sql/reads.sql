-- name: GetKey :one
select * from kvstore where key = $1;
