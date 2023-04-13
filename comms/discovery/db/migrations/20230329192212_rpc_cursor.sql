-- migrate:up

create table if not exists rpc_cursor (
	relayed_by text primary key,
	relayed_at timestamp without time zone not null
);

-- migrate:down

