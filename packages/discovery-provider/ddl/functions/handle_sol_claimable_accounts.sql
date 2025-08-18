CREATE OR REPLACE FUNCTION handle_sol_claimable_accounts()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id int;
BEGIN
    FOR v_user_id IN
        SELECT user_id
        FROM users
        WHERE users.wallet = NEW.ethereum_address
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
    CREATE TRIGGER on_sol_claimable_accounts
    AFTER INSERT ON sol_claimable_accounts
    FOR EACH ROW EXECUTE PROCEDURE handle_sol_claimable_accounts();
EXCEPTION
  WHEN others THEN NULL;
END $$;
COMMENT ON TRIGGER on_sol_claimable_accounts ON sol_claimable_accounts IS 
    'Updates sol_user_balances whenever a sol_claimable_account is inserted.';