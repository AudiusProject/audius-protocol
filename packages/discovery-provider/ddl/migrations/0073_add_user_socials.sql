begin;

alter table users add column if not exists twitter_handle varchar;
alter table users add column if not exists instagram_handle varchar;
alter table users add column if not exists tiktok_handle varchar;
alter table users add column if not exists verified_with_twitter boolean default false;
alter table users add column if not exists verified_with_instagram boolean default false;
alter table users add column if not exists verified_with_tiktok boolean default false;
alter table users add column if not exists website varchar;
alter table users add column if not exists donation varchar;

commit;
