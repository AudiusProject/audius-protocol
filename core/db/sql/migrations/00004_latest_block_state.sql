-- +migrate Up
create table core_app_state(
  block_height bigint not null,
  app_hash bytea not null,
  created_at timestamp default current_timestamp,
  primary key (block_height, app_hash)
);

-- +migrate Down
drop table if exists core_app_state;
