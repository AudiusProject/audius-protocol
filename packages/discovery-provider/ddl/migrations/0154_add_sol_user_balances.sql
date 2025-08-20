CREATE TABLE IF NOT EXISTS sol_user_balances (
    user_id INT NOT NULL,
    mint TEXT NOT NULL,
    balance BIGINT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, mint)
);
COMMENT ON TABLE sol_user_balances IS 'Stores the balances of Solana tokens for users.';
CREATE INDEX IF NOT EXISTS sol_user_balances_mint_user_id_idx ON sol_user_balances (mint, user_id);
COMMENT ON INDEX sol_user_balances_mint_user_id_idx IS 'Index for quick access to user balances by mint and user ID.';

-- Populate the sol user_balances table with current balances
INSERT INTO sol_user_balances (mint, user_id, balance)
SELECT mint, user_id, SUM(balance)
FROM (
	SELECT
		sol_token_account_balances.mint,
		associated_wallets.user_id,
		sol_token_account_balances.balance
	FROM sol_token_account_balances
	JOIN associated_wallets 
		ON associated_wallets.wallet = sol_token_account_balances.owner
		AND associated_wallets.chain = 'sol'
	UNION ALL
	SELECT
		sol_token_account_balances.mint,
		users.user_id,
		sol_token_account_balances.balance
	FROM sol_token_account_balances
	JOIN sol_claimable_accounts
		ON sol_claimable_accounts.account = sol_token_account_balances.account
	JOIN users 
		ON users.wallet = sol_claimable_accounts.ethereum_address
) balances
GROUP BY mint, user_id
ON CONFLICT DO NOTHING;