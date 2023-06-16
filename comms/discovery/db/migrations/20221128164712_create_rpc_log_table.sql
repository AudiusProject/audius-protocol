-- migrate:up
create table if not exists rpc_log (
	-- id string primary key, -- todo: get this from rpc
	jetstream_sequence integer not null,
	jetstream_timestamp timestamp not null,
	from_wallet text,
	rpc json not null,
	sig text not null
);

-- migrate:down
drop table if exists rpc_log cascade;
