begin;

DO
$$
  BEGIN
    ALTER TABLE chat_blast RENAME COLUMN audience_track_id TO audience_content_id;
  EXCEPTION
    WHEN undefined_column THEN
  END;
$$;

ALTER TABLE chat_blast ADD COLUMN IF NOT EXISTS audience_content_type text;

commit;
