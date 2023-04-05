-- migrate:up

alter table rpc_log rename column jetstream_timestamp to relayed_at;
alter table rpc_log add column applied_at timestamp without time zone;

alter table rpc_log drop constraint if exists rpc_log_pkey;
alter table rpc_log drop column if exists id;
alter table rpc_log add primary key (sig);

create index if not exists idx_rpc_relayed_by on rpc_log(relayed_by, relayed_at);

-- migrate:down

