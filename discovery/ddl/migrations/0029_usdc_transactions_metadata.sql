ALTER TABLE
    usdc_transactions_history
ADD
    COLUMN IF NOT EXISTS tx_metadata CHARACTER VARYING;