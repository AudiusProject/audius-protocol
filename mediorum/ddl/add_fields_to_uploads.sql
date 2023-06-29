begin;

ALTER TABLE uploads
ADD COLUMN IF NOT EXISTS user_id integer,
ADD COLUMN IF NOT EXISTS preview_start_seconds integer,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;

commit;
