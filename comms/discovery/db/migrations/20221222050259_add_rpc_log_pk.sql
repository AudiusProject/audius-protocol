-- migrate:up
alter table rpc_log add primary key (jetstream_sequence);

-- migrate:down
alter table rpc_log drop constraint rpc_log_pkey;
