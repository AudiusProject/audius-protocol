BEGIN;

-- USDC user bank accounts
CREATE TABLE IF NOT EXISTS usdc_user_bank_accounts (
    "signature" varchar NOT NULL,
    ethereum_address varchar NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    bank_account varchar NOT NULL,
    PRIMARY KEY("signature")
);
CREATE INDEX IF NOT EXISTS idx_usdc_user_bank_accounts_eth_address ON usdc_user_bank_accounts USING btree (ethereum_address);

-- USDC transactions history
CREATE TABLE IF NOT EXISTS usdc_transactions_history (
    user_bank varchar NOT NULL,
    slot integer NOT NULL,
    "signature" varchar NOT NULL,
    transaction_type varchar NOT NULL,
    method varchar NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    transaction_created_at timestamp NOT NULL,
    change numeric NOT NULL,
    balance numeric NOT NULL,
    PRIMARY KEY(user_bank, "signature")
);
CREATE INDEX IF NOT EXISTS idx_usdc_transactions_history_slot ON usdc_transactions_history USING btree (slot);
CREATE INDEX IF NOT EXISTS idx_usdc_transactions_history_type ON usdc_transactions_history USING btree (transaction_type);

-- USDC purchases table
DO $$ BEGIN
    CREATE TYPE usdc_purchase_content_type AS ENUM ('track', 'playlist', 'album');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS usdc_purchases (
    slot integer NOT NULL,
    "signature" varchar NOT NULL,
    buyer_user_id integer NOT NULL,
    seller_user_id integer NOT NULL,
    amount bigint NOT NULL,
    content_type usdc_purchase_content_type NOT NULL,
    content_id integer NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(slot, "signature")
);
CREATE INDEX IF NOT EXISTS idx_usdc_purchases_buyer ON usdc_purchases USING btree (buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_usdc_purchases_seller ON usdc_purchases USING btree (seller_user_id);
CREATE INDEX IF NOT EXISTS idx_usdc_purchases_type ON usdc_purchases USING btree (content_type);

COMMIT;