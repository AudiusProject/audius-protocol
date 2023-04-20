-- run from project root:
-- psql -q -f ddl/test/files_trigger_test.sql

drop database if exists files_trigger_test;
create database files_trigger_test;
\c files_trigger_test

-- subset of fields we actually use
CREATE TABLE IF NOT EXISTS "Files" (
    multihash text NOT NULL,
    "dirMultihash" text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);



-- load code under test
\i ddl/files_trigger.sql



LISTEN cid_log;


-- test: insert
insert into "Files" values
  ('cid1', NULL, now(), now()),
  ('cid2', NULL, now(), now());

do $$ begin
  assert (select count(*) from cid_log) = 2;
  assert (select updated_at from cid_log where multihash = 'cid1') =
         (select updated_at from cid_log where multihash = 'cid2');
end; $$;


-- test: delete
delete from "Files" where multihash = 'cid2';

do $$ begin
  assert (select count(*) from cid_log) = 2;
  assert (select count(*) from cid_log where is_deleted) = 1;
  -- cid2 has a newer updated_at
  assert (select updated_at from cid_log where multihash = 'cid1') <
         (select updated_at from cid_log where multihash = 'cid2');
end; $$;


-- test: dirMultihash
truncate "Files";
truncate cid_log;

insert into "Files" values
  ('dir1v1', 'dir1', now(), now()),
  ('dir1v2', 'dir1', now(), now()),
  ('dir2v1', 'dir2', now(), now()),
  ('dir2v2', 'dir2', now(), now())
  ;

do $$ begin
  assert (select count(*) from cid_log where multihash = 'dir1') = 1;
  -- cid_log has 3 rows: dir1, dir1v1, dir1v2
  assert (select count(*) from cid_log where multihash like 'dir1%') = 3;
end; $$;

-- test: dirMultihash delete

delete from "Files" where multihash = 'dir1v1';

do $$ begin
  -- dir1v1 is deleted
  assert (select is_deleted from cid_log where multihash = 'dir1v1');
  -- but dir1v2 is still present
  assert (select is_deleted from cid_log where multihash = 'dir1v2') = false;
  -- still, we mark the dirMultihash as deleted if any member cid is deleted
  -- since the dirMultihash is incomplete
  assert (select is_deleted from cid_log where multihash = 'dir1');
end; $$;
