CREATE TABLE IF NOT EXISTS user_payout_wallet_history (
    user_id INTEGER NOT NULL,
    spl_usdc_payout_wallet VARCHAR,
    blocknumber INTEGER NOT NULL,
    block_timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, block_timestamp),
    CONSTRAINT user_payout_wallet_history_blocknumber_fkey FOREIGN KEY (blocknumber) REFERENCES blocks("number") ON DELETE CASCADE
);