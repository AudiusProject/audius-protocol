begin;

alter table chat_permissions drop constraint chat_permissions_pkey;

delete from chat_permissions where permits is null;

ALTER TABLE chat_permissions
ALTER COLUMN permits SET NOT NULL;

ALTER TABLE chat_permissions
ADD PRIMARY KEY (user_id, permits);

ALTER TABLE chat_permissions ADD COLUMN allowed BOOLEAN NOT NULL DEFAULT TRUE;

commit;
