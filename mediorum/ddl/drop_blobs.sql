begin;

-- ensure there is a blobs table
-- (so this can work on an empty db)
create table if not exists blobs (
  "key" text primary key
);

-- our unique list of Qm CIDs
create table if not exists qm_cids (
  "key" text primary key
);

insert into qm_cids ("key")
select distinct "key"
from blobs
where "key" ilike 'qm%'
on conflict do nothing
;

-- todo: do this later when confident all good:
-- drop table blobs;

-- remove all the noisy blob history
delete from ops where "table" = 'blobs';


-- reset ops cursors...
-- now that ops is "gossip" style this will ensure historical Uploads are created if missing
-- todo: do this next deploy after blobs ops have been cut down... so that we just revisit uploads
-- truncate cursors;

commit;
