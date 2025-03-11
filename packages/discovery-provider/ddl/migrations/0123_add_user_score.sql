begin;
ALTER TABLE aggregate_user
ADD IF NOT EXISTS score integer default 0;
commit;