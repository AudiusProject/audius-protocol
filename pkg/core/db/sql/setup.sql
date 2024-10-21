-- name: CheckDatabaseExists :one
select exists (select datname from pg_catalog.pg_database where datname = $1) as exists;
