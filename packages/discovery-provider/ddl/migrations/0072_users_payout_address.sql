begin;

alter table users add column if not exists spl_usdc_payout_wallet varchar;

commit;
