begin;

alter table grants alter column is_approved drop not null;
alter table grants alter column is_approved set default null;


commit;
