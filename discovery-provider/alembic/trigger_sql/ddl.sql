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
