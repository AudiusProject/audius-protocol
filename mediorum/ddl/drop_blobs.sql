begin;

create table if not exists blobs (
  "key" text primary key
);

create table if not exists qm_cids (
  "key" text primary key
);

insert into qm_cids ("key")
select distinct "key"
from blobs
where "key" ilike 'qm%'
on conflict do nothing
;

drop table blobs;

delete from ops where "table" = 'blobs';

commit;
