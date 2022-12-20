-- migrate:up

create table chat_permissions (
	user_id int primary key,
	permits text default 'all'
);

-- migrate:down
drop table chat_permissions;
