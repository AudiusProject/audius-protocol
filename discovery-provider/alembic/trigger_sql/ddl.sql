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

-- Step 1: Change 'supporting_rank_up' to temporary value 'temp_rank_up'
update notification n
set type = 'temp_rank_up', type_v2 = 'temp_rank_up', group_id = 'temp_rank_up' || substring(group_id from position(':' in group_id))
where type = 'supporting_rank_up' and type_v2 is null;

-- Step 2: Change 'supporter_rank_up' to 'supporting_rank_up'
update notification n
set type = 'supporting_rank_up', type_v2 = 'supporting_rank_up', group_id = 'supporting_rank_up' || substring(group_id from position(':' in group_id))
where type = 'supporter_rank_up' and type_v2 is null;

-- Step 3: Change temporary value 'temp_rank_up' to 'supporter_rank_up'
update notification n
set type = 'supporter_rank_up', type_v2 = 'supporter_rank_up', group_id = 'supporter_rank_up' || substring(group_id from position(':' in group_id))
where type = 'temp_rank_up' and type_v2 = 'temp_rank_up';
commit;

-- 4/13/23: add is_storage_v2 to users table
begin;
    alter table users
    add column if not exists is_storage_v2 boolean not null default false;
commit;

-- 4/18/23: add is_available index
begin;
    create index if not exists users_is_available_false_idx on users (is_available) where is_available = false;
commit;

-- 4/25/23: add duration to tracks table
begin;
    alter table tracks
    add column if not exists duration integer default 0;
commit;
commit;  

-- 4/26/23: create delegates table
begin;
  create table public.app_delegates (
    address varchar primary key not null,
    blockhash varchar references blocks(blockhash),
    blocknumber integer references blocks(number),
    user_id integer,
    name varchar not null,
    is_personal_access boolean not null default false,
    is_revoked boolean not null default false,
    created_at timestamp not null,
    txhash varchar not null
  );
commit;


