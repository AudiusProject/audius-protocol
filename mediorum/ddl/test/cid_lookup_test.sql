-- run from project root:
-- psql -q -f ddl/test/cid_lookup_test.sql

drop database if exists cid_lookup_test;
create database cid_lookup_test;
\c cid_lookup_test

drop table if exists "Files";

-- subset of fields we actually use
CREATE TABLE IF NOT EXISTS "Files" (
    multihash text NOT NULL,
    "dirMultihash" text,
    "type" text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


-- insert an existing row to verify backfill works correctly
insert into "Files" values
  ('cid0', NULL, 'track', now(), now()),
  ('cid1', NULL, 'image', now(), now());


-- load code under test
\i ddl/cid_lookup.sql


-- test: insert
insert into "Files" values
  ('cid2', NULL, 'image', now(), now()),
  -- a track should be ignored
  ('cid3', NULL, 'track', now(), now());

do $$ begin
  assert (select count(*) from cid_log) = 2;
end; $$;


-- test: delete
delete from "Files" where multihash = 'cid2';
delete from "Files" where multihash = 'cid3';

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
  ('dir1v1', 'dir1', 'dir', now(), now()),
  ('dir1v2', 'dir1', 'dir', now(), now()),
  ('dir2v1', 'dir2', 'dir', now(), now()),
  ('dir2v2', 'dir2', 'dir', now(), now())
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
