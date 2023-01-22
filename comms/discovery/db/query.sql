-- name: CreateUser :one
insert into users (
  user_id, handle, is_current
) values (
  $1, $2, true
)
returning *;
