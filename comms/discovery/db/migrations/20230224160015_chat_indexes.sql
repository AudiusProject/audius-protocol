-- migrate:up
create index if not exists idx_chat_message_chat_id on chat_message(chat_id);
create index if not exists idx_chat_message_user_id on chat_message(user_id);
create index if not exists idx_chat_message_reactions_message_id on chat_message_reactions(message_id);

-- migrate:down
drop index if exists idx_chat_message_chat_id;
drop index if exists idx_chat_message_user_id;
drop index if exists idx_chat_message_reactions_message_id;
