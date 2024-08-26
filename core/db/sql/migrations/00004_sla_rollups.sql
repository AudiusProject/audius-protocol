-- +migrate Up
create table sla_rollups(
  id serial primary key,
  block_start bigint not null,
  block_end bigint not null,
  time timestamp not null
);

create table sla_node_reports(
  id serial primary key,
  address varchar not null,
  blocks_proposed int not null,
  sla_rollup_id int references sla_rollups
);

create index idx_time on sla_rollups(time desc);

create unique index sla_node_unique_finalized_report
on sla_node_reports (address)
where sla_rollup_id is not null;

create unique index sla_node_unique_unfinalized_report
on sla_node_reports (address)
where sla_rollup_id is null;

-- +migrate Down
drop table if exists sla_rollups;
drop table if exists sla_node_reports;
