begin;

alter table tracks add column if not exists is_comments_disabled boolean default false;

commit;
