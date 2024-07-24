-- +migrate Up
create table kvstore(
  id serial primary key,
  key varchar(255) unique not null,
  value text not null,
  tx_hash text not null,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp on update current_timestamp
)

-- +migrate Down
drop table if exists kvstore;
