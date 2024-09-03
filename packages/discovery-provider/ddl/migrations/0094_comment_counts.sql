begin;

alter table tracks
add column if not exists comment_count integer not null default 0;

commit;