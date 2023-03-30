-- Add new ddl changes to the bottom of the file.
-- Wrap your changes with begin; / commit;


-- 3/21/23: add a comment to a table for a simple ddl demo
begin;
  comment on table users is 'the users table';
commit;


-- 3/29/23: define `to_timestamp_safe`
begin;
  CREATE OR REPLACE FUNCTION to_timestamp_safe(p_timestamp VARCHAR, p_format VARCHAR)
  RETURNS TIMESTAMP
  LANGUAGE plpgsql
  as $$
  DECLARE
      ret_timestamp TIMESTAMP;
  BEGIN
      IF p_timestamp = '' THEN
          RETURN NULL;
      END IF;
      RETURN to_timestamp( p_timestamp, p_format );
  EXCEPTION
  WHEN others THEN
      RETURN null;
  END;
  $$;
commit;