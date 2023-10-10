begin;

truncate table chat_ban;
alter table chat_ban add column if not exists is_banned boolean not null;
alter table chat_ban add column if not exists updated_at timestamp without time zone not null;

commit;

