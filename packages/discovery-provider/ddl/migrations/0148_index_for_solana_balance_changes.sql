CREATE INDEX IF NOT EXISTS sol_token_account_balance_changes_mint_account_slot_idx ON sol_token_account_balance_changes (mint, account, slot DESC);
COMMENT ON INDEX sol_token_account_balance_changes_mint_account_slot_idx IS 'Used for getting top current balances for a mint.';

-- Make these more efficient by using DESC for slot

DROP INDEX IF EXISTS sol_token_account_balance_changes_account_idx;
CREATE INDEX sol_token_account_balance_changes_account_idx ON sol_token_account_balance_changes (account, slot DESC);

DROP INDEX IF EXISTS sol_token_account_balance_changes_mint_idx;
CREATE INDEX sol_token_account_balance_changes_mint_idx ON sol_token_account_balance_changes (mint, slot DESC);