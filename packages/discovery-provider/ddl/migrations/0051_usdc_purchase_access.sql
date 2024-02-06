begin;
  -- add columns to usdc_purchases
  alter table usdc_purchases
  add column if not exists is_streamable boolean default true;
  alter table usdc_purchases
  add column if not exists is_downloadable boolean default true;

  -- add access column to track_price_history
  do $$ begin
    create type usdc_purchase_access_type as enum ('stream', 'download');
  exception
    when duplicate_object then null;
  end $$;

  alter table track_price_history
  add column if not exists access usdc_purchase_access_type not null default 'stream';
commit;
