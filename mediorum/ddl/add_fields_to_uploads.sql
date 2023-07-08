begin;

ALTER TABLE uploads
ADD COLUMN IF NOT EXISTS user_id integer,
ADD COLUMN IF NOT EXISTS selected_preview string,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS transcoded_mirrors text[];

commit;
