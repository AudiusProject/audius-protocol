begin;

alter table developer_apps add column if not exists image_url varchar;

commit;
