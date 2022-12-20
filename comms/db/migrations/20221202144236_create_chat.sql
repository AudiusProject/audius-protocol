-- migrate:up

create table chat (
	chat_id text primary key,
	created_at timestamp not null,
	last_message_at timestamp not null
);

create index chat_chat_id_idx on chat(chat_id);

create table chat_member (
	chat_id text not null references chat(chat_id),
	user_id int not null,
	cleared_history_at timestamp,

	invited_by_user_id int not null,
	invite_code text not null,

	-- invite... the shared secret for the chat... including ephemeral key + encrypted shared secret for invitee

	last_active_at timestamp,
	unread_count int not null default 0,

	primary key (chat_id, user_id)
);

create index chat_member_user_idx on chat_member(user_id);

create table chat_message (
	message_id text primary key,
	chat_id text not null,
	user_id int not null,
	created_at timestamp not null, -- jetstream_timestamp
	ciphertext text not null,

	constraint fk_chat_member
		foreign key (chat_id, user_id)
		references chat_member(chat_id, user_id)
);

-- migrate:down
drop table chat;
drop index chat_chat_id_idx;
drop table chat_member;
drop index chat_member_user_idx;
drop table chat_message;
