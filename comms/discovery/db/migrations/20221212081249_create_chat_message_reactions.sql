-- migrate:up
create table if not exists chat_message_reactions (
	user_id int not null,
	message_id text not null references chat_message(message_id),
	reaction text not null,
	created_at timestamp not null default current_timestamp,
	updated_at timestamp not null default current_timestamp,
	primary key (user_id, message_id)
)

-- migrate:down
drop table if exists chat_message_reactions cascade;
