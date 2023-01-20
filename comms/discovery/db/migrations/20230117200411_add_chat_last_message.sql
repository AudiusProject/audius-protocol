-- migrate:up
alter table chat add column if not exists last_message text;

-- migrate:down
alter table chat drop column if exists last_message;
