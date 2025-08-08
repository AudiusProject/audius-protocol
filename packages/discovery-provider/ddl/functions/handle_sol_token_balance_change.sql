CREATE OR REPLACE FUNCTION handle_sol_token_balance_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO sol_token_account_balances (account, mint, owner, balance, slot, updated_at)
    VALUES (NEW.account, NEW.mint, NEW.owner, NEW.balance, NEW.slot, NOW())
    ON CONFLICT (account)
    DO UPDATE SET
        balance = EXCLUDED.balance,
        slot = EXCLUDED.slot,
        updated_at = NOW()
        WHERE sol_token_account_balances.slot < EXCLUDED.slot;
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