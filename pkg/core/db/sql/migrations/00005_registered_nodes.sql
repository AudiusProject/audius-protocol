-- +migrate Up
create table core_validators(
  rowid serial primary key,
  pub_key text not null,
  endpoint text not null,
  eth_address text not null,
  comet_address text not null,
  eth_block text not null,
  node_type text not null,
  sp_id text not null
);

create index idx_core_validators_eth_address on core_validators(eth_address);
create index idx_core_validators_comet_address on core_validators(comet_address);
create index idx_core_validators_endpoint on core_validators(endpoint);

-- +migrate Down
drop index if exists idx_core_validators_eth_address;
drop index if exists idx_core_validators_comet_address;
drop index if exists idx_core_validators_endpoint;
drop table if exists core_validators;
