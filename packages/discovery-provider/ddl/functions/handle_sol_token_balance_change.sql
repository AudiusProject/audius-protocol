CREATE OR REPLACE FUNCTION handle_sol_token_balance_change()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id int;
BEGIN
    INSERT INTO sol_token_account_balances (account, mint, owner, balance, slot, updated_at)
    VALUES (NEW.account, NEW.mint, NEW.owner, NEW.balance, NEW.slot, NOW())
    ON CONFLICT (account)
    DO UPDATE SET
        balance = EXCLUDED.balance,
        slot = EXCLUDED.slot,
        updated_at = NOW()
        WHERE sol_token_account_balances.slot < EXCLUDED.slot;
    
    FOR v_user_id IN
        SELECT user_id
        FROM associated_wallets
        WHERE wallet = NEW.owner
          AND chain = 'sol'
        UNION ALL
        SELECT user_id
        FROM users
        JOIN sol_claimable_accounts ON sol_claimable_accounts.ethereum_address = users.wallet
        WHERE sol_claimable_accounts.account = NEW.account
          AND sol_claimable_accounts.mint = NEW.mint
    LOOP
        PERFORM update_sol_user_balance_mint(v_user_id, NEW.mint);
    END LOOP;

    RETURN NULL;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'An error occurred in %: %', TG_NAME, SQLERRM;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    CREATE TRIGGER on_sol_token_account_balance_changes
    AFTER INSERT ON sol_token_account_balance_changes
    FOR EACH ROW EXECUTE PROCEDURE handle_sol_token_balance_change();
EXCEPTION
  WHEN others THEN NULL;
END $$;
COMMENT ON TRIGGER on_sol_token_account_balance_changes ON sol_token_account_balance_changes IS 'Updates sol_token_account_balances whenever a sol_token_balance_change is inserted with a higher slot.';