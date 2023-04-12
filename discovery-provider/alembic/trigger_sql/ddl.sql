-- Add new ddl changes to the bottom of the file.
-- Wrap your changes with begin; / commit;


-- 3/21/23: add a comment to a table for a simple ddl demo
begin;
  comment on table users is 'the users table';
commit;

-- 3/28/23: add is_available to users table
begin;
    alter table users
    add column if not exists is_available boolean not null default true;
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

-- 4/4/23: drop blocks_copy
begin;
  drop table if exists blocks_copy;
commit;

-- 4/10/23: inverse supporter rank up and supporting rank up notifications
-- context: supporter rank up and supporting rank up notifications were
-- reversed when we first added them to the handle_supporter_rank_up.sql trigger.
-- this migration is meant to swap those types for any notification made when this migration
-- was first run. we indicate whether the entry is from when a migration was first run
-- by looking at whether type_v2 is null. supporter/ing_rank_up notifications
-- created after this migration was run should have type_v2 as not null
-- (see handle_supporter_rank_ups.sql)
begin;
alter table notification
add column if not exists type_v2 varchar default null;

update notification n
set type = 'supporter_rank_up', type_v2 = 'supporter_rank_up', group_id = 'supporter_rank_up' || substring(group_id from position(':' in group_id))
where type = 'supporting_rank_up' and type_v2 is null;

update notification 
set type = 'supporting_rank_up', type_v2 = 'supporting_rank_up', group_id = 'supporting_rank_up' || substring(group_id from position(':' in group_id))
where type = 'supporter_rank_up' and type_v2 is null;
commit;