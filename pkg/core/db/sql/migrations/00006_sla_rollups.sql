-- +migrate Up
create table sla_rollups(
  id serial primary key,
  tx_hash text not null,
  block_start bigint not null,
  block_end bigint not null,
  time timestamp not null
);

create table sla_node_reports(
  id serial primary key,
  address varchar not null,
  blocks_proposed int not null,
  sla_rollup_id int references sla_rollups,
  unique (address, sla_rollup_id)
);

create index idx_time on sla_rollups(time desc);

-- +migrate Down
drop table if exists sla_node_reports;
drop table if exists sla_rollups;
