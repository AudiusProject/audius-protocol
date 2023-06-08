-- migrate:up

create table if not exists chat_ban (
	user_id int not null primary key
);

-- migrate:down

