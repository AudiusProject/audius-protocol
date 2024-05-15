begin;

alter table usdc_purchases add column if not exists city varchar;
alter table usdc_purchases add column if not exists region varchar;
alter table usdc_purchases add column if not exists country varchar;

commit;
