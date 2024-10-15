-- +migrate Up
drop index if exists idx_core_kvstore_key;
drop index if exists idx_core_kvstore_tx_hash;
drop table if exists core_kvstore;

-- +migrate Down
