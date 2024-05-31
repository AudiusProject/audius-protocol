begin;

-- create social platform enum type
do $$ begin
  create type social_platform as enum ('twitter', 'instagram', 'tiktok');
exception
  when duplicate_object then null;
end $$;

-- add socials columns to users
alter table users add column if not exists twitter_handle varchar;
alter table users add column if not exists instagram_handle varchar;
alter table users add column if not exists tiktok_handle varchar;
alter table users add column if not exists website varchar;
alter table users add column if not exists donation varchar;
alter table users add column if not exists verified_with social_platform;

commit;
