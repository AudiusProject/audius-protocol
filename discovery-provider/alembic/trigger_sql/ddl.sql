-- Add new ddl changes to the bottom of the file.
-- Wrap your changes with begin; / commit;


-- 3/21/23: add a comment to a table for a simple ddl demo
begin;
  comment on table users is 'the users table';
commit;
