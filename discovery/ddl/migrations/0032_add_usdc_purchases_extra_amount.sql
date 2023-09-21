begin;

ALTER TABLE
    usdc_purchases
ADD
    COLUMN IF NOT EXISTS extra_amount BIGINT NOT NULL DEFAULT 0;

commit;