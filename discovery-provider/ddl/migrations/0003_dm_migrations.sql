-- porting over any semi-recent DMs migration from dbmate
create table if not exists chat_ban (
	user_id int not null primary key
);

-- cascade delete
alter table chat_member drop constraint if exists chat_member_chat_id_fkey;
alter table chat_member add constraint chat_member_chat_id_fkey foreign key (chat_id) references chat(chat_id) on delete cascade;

alter table chat_message drop constraint if exists fk_chat_member;
alter table chat_message drop constraint if exists chat_message_chat_member_fkey;
alter table chat_message add constraint chat_message_chat_member_fkey foreign key (chat_id, user_id) references chat_member(chat_id, user_id) on delete cascade;

alter table chat_message_reactions drop constraint if exists chat_message_reactions_message_id_fkey;
alter table chat_message_reactions add constraint chat_message_reactions_message_id_fkey foreign key (message_id) references chat_message(message_id) on delete cascade;


-- add timestamp for permissions updates
alter table chat_permissions add column if not exists updated_at timestamp without time zone not null default to_timestamp(0);

