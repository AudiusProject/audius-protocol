begin;
ALTER TABLE aggregate_user
ADD IF NOT EXISTS score integer;
commit;