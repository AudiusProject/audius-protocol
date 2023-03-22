-- migrate:up

alter table rpc_log add column id text;

update rpc_log set id = to_char(jetstream_timestamp at time zone 'utc', 'YYYYMMDDHHMMSSMS') || '_' || md5(rpc::text);

-- delete dupes
DELETE FROM rpc_log a WHERE a.ctid <> (SELECT min(b.ctid)
                 FROM   rpc_log b
                 WHERE  a.id = b.id);

alter table rpc_log drop constraint rpc_log_pkey;

alter table rpc_log add primary key (id);


-- migrate:down

alter table rpc_log drop column id;
alter table rpc_log add primary key (jetstream_sequence);
