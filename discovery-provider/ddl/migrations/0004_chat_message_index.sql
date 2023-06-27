begin;
drop index if exists idx_chat_message_user_id;
create index idx_chat_message_user_id on chat_message(user_id, created_at);
commit;
