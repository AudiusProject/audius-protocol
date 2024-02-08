begin;
  -- create type
  do $$ begin
    create type usdc_purchase_access_type as enum ('stream', 'download');
  exception
    when duplicate_object then null;
  end $$;

  -- add columns to usdc_purchases
  alter table usdc_purchases
  add column if not exists access usdc_purchase_access_type not null default 'stream';

  -- add columns to track_price_history
  alter table track_price_history
  add column if not exists access usdc_purchase_access_type not null default 'stream';
commit;
