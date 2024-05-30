begin;

alter table users add column if not exists twitter_handle varchar;
alter table users add column if not exists instagram_handle varchar;
alter table users add column if not exists tiktok_handle varchar;
alter table users add column if not exists website varchar;
alter table users add column if not exists donation varchar;

commit;
