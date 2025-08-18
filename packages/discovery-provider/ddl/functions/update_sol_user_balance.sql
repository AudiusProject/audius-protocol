CREATE OR REPLACE FUNCTION update_sol_user_balance_mint(p_user_id int, p_mint varchar)
RETURNS VOID AS $$
BEGIN
    INSERT INTO sol_user_balances
        (user_id, mint, balance, updated_at, created_at)
    SELECT
        p_user_id,
        p_mint,
        SUM(balance),
        NOW(),
        NOW()
    FROM (
        SELECT 
            p_user_id AS user_id, 
            COALESCE(balance, 0) AS balance
        FROM associated_wallets 
        JOIN sol_token_account_balances AS associated_wallet_balances
            ON associated_wallet_balances.owner = associated_wallets.wallet
            AND associated_wallet_balances.mint = p_mint
        WHERE associated_wallets.user_id = p_user_id
            AND associated_wallets.chain = 'sol'
            AND associated_wallets.is_delete = FALSE

        UNION ALL

        SELECT 
            p_user_id AS user_id, 
            COALESCE(balance, 0) AS balance
        FROM users
        JOIN sol_claimable_accounts
            ON sol_claimable_accounts.ethereum_address = users.wallet
            AND sol_claimable_accounts.mint = p_mint
        JOIN sol_token_account_balances
            ON sol_token_account_balances.account = sol_claimable_accounts.account
        WHERE users.user_id = p_user_id
    ) AS balances
    GROUP BY user_id
    ON CONFLICT (user_id, mint)
    DO UPDATE SET
        balance = EXCLUDED.balance,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;