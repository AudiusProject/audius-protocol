begin;

ALTER TABLE chat_member ADD COLUMN IF NOT EXISTS is_hidden boolean not null default false;

commit;
