-- +migrate Up
create table core_tx_stats(
  id serial primary key,
  tx_type text not null,
  tx_hash text not null unique,
  block_height bigint not null,
  created_at timestamp default current_timestamp
);

create index idx_core_stats_tx_type on core_tx_stats(tx_type);
create index idx_core_tx_hash on core_tx_stats(tx_hash);
create index idx_core_tx_stats_created_at on core_tx_stats(created_at);
CREATE INDEX idx_core_tx_stats_time_type ON core_tx_stats (created_at, tx_type);

-- +migrate Down
drop index if exists idx_recent_core_tx_stats;
drop index if exists idx_core_tx_stats_created_at;
drop index if exists idx_core_stats_tx_type;
drop index if exists idx_core_tx_hash;
drop table if exists core_tx_stats;
