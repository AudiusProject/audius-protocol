DROP INDEX IF EXISTS sol_token_account_balance_changes_block_timestamp;
CREATE INDEX IF NOT EXISTS sol_token_account_balance_changes_mint_block_timestamp
    ON sol_token_account_balance_changes (mint, block_timestamp DESC);