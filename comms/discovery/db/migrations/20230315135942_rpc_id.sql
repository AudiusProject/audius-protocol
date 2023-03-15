-- migrate:up

alter table rpc_log add column id text;

update rpc_log set id = to_char(jetstream_timestamp at time zone 'utc', 'YYYYMMDDHHMMSSMS') || '_' || md5(rpc::text);

alter table rpc_log drop constraint rpc_log_pkey;

alter table rpc_log add primary key (id);


-- migrate:down

alter table rpc_log drop column id;
alter table rpc_log add primary key (jetstream_sequence);
