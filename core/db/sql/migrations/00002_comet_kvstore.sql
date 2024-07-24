-- +migrate Up
create table kvstore(
  id serial primary key,
  key varchar(255) unique not null,
  value text not null,
  tx_hash text not null,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create index idx_kvstore_key on kvstore(key);
create index idx_kvstore_tx_hash on kvstore(tx_hash);

-- +migrate Down
drop index if exists idx_kvstore_key;
drop index if exists idx_kvstore_tx_hash;
drop table if exists kvstore;
