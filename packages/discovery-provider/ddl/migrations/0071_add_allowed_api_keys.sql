begin;
alter table tracks add column if not exists allowed_api_keys text[];
commit;