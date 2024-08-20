begin;

alter table chat add column if not exists last_message_is_plaintext boolean default false;

commit;
