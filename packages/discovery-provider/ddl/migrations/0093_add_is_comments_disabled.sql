begin;

alter table tracks
add column if not exists comments_disabled boolean default false;

commit;