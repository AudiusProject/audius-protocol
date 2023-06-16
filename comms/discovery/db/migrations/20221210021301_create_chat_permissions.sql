-- migrate:up

create table if not exists chat_permissions (
	user_id int primary key,
	permits text default 'all'
);

-- migrate:down
drop table if exists chat_permissions cascade;
