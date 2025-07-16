BEGIN;

-- begin Recreate sol_token_account_balances table with owner and index
DROP TABLE IF EXISTS sol_token_account_balance_changes;
CREATE TABLE sol_token_account_balance_changes (
    signature VARCHAR NOT NULL,
    mint VARCHAR NOT NULL,
    owner VARCHAR NOT NULL,  -- Added owner field
    account VARCHAR NOT NULL,
    change BIGINT NOT NULL,
    balance BIGINT NOT NULL,
    slot BIGINT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    block_timestamp TIMESTAMP NOT NULL,

    PRIMARY KEY (signature, mint, account)
);
COMMENT ON TABLE sol_token_account_balance_changes IS 'Stores token balance changes for all accounts of tracked mints.';
CREATE INDEX IF NOT EXISTS sol_token_account_balance_changes_mint_idx ON sol_token_account_balance_changes (mint, slot);
COMMENT ON INDEX sol_token_account_balance_changes_mint_idx IS 'Used for getting recent transactions by mint.';
CREATE INDEX IF NOT EXISTS sol_token_account_balance_changes_account_idx ON sol_token_account_balance_changes (account, slot);
COMMENT ON INDEX sol_token_account_balance_changes_account_idx IS 'Used for getting recent transactions by account.';

-- New indexes
CREATE INDEX IF NOT EXISTS sol_token_account_balance_changes_owner_slot_idx ON sol_token_account_balance_changes (owner, slot DESC);
COMMENT ON INDEX sol_token_account_balance_changes_owner_slot_idx IS 'Used for associating connected wallets with the transaction.';
CREATE INDEX IF NOT EXISTS sol_token_account_balance_changes_block_timestamp ON sol_token_account_balance_changes (block_timestamp DESC, mint);
COMMENT ON INDEX sol_token_account_balance_changes_block_timestamp IS 'Used for finding member count from > 24hrs ago.';
-- end Recreate sol_token_account_balances table with owner and index

CREATE TABLE IF NOT EXISTS sol_token_account_balances (
    account VARCHAR NOT NULL,
    mint VARCHAR NOT NULL,
    owner VARCHAR NOT NULL,
    balance BIGINT NOT NULL,
    slot BIGINT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (account)
);

COMMENT ON TABLE sol_token_account_balances IS 'Stores current token balances for all accounts of tracked mints.';
CREATE INDEX IF NOT EXISTS sol_token_account_balances_mint_idx ON sol_token_account_balances (mint);
COMMENT ON INDEX sol_token_account_balances_mint_idx IS 'Used for getting current balances by mint.';

COMMIT;