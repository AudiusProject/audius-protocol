begin;

alter table aggregate_track
add column if not exists comment_count integer default 0;

commit;