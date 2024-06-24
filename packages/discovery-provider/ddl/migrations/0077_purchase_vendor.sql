begin;
    alter table usdc_purchases add column if not exists vendor varchar;
end;