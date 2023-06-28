begin;

-- add column
alter table chat_member add column created_at timestamp without time zone;

-- backfill from chat row
update chat_member m
set created_at = c.created_at
from chat c
where m.chat_id = c.chat_id;

-- make not null
alter table chat_member alter column created_at set not null;

commit;
