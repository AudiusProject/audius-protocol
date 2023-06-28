begin;

ALTER TABLE uploads
ADD COLUMN IF NOT EXISTS user_id integer,
ADD COLUMN IF NOT EXISTS preview_start_seconds integer;

commit;
