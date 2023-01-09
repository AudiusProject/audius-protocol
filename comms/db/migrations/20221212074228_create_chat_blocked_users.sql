-- migrate:up
create table if not exists chat_blocked_users (
	blocker_user_id int not null,
	blockee_user_id int not null,
	created_at timestamp not null default current_timestamp,

	primary key (blocker_user_id, blockee_user_id)
);

-- migrate:down
drop table if exists chat_blocked_users cascade;
