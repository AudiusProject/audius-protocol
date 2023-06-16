-- migrate:up

truncate rpc_log cascade;
truncate chat cascade;
truncate chat_blocked_users cascade;
truncate chat_member cascade;
truncate chat_message cascade;
truncate chat_message_reactions cascade;
truncate chat_permissions cascade;

alter table rpc_log add column if not exists relayed_by text not null;
alter table rpc_log alter column from_wallet set not null;
alter table rpc_log drop column if exists jetstream_sequence;


-- migrate:down

