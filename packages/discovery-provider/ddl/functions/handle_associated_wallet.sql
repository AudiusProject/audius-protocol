CREATE OR REPLACE FUNCTION handle_associated_wallets()
RETURNS TRIGGER AS $$
DECLARE
    v_mint varchar;
BEGIN
    -- For INSERT, always run
    IF TG_OP = 'INSERT' THEN
        FOR v_mint IN
            SELECT DISTINCT mint FROM sol_token_account_balances WHERE owner = NEW.wallet
        LOOP
            PERFORM update_sol_user_balance_mint(NEW.user_id, v_mint);
        END LOOP;
    END IF;

    -- For UPDATE, only run if is_delete changed
    IF TG_OP = 'UPDATE' AND (NEW.is_delete IS DISTINCT FROM OLD.is_delete) THEN
        FOR v_mint IN
            SELECT DISTINCT mint FROM sol_token_account_balances WHERE owner = NEW.wallet
        LOOP
            PERFORM update_sol_user_balance_mint(NEW.user_id, v_mint);
        END LOOP;
    END IF;

    -- For DELETE, always run
    IF TG_OP = 'DELETE' THEN
        FOR v_mint IN
            SELECT DISTINCT mint FROM sol_token_account_balances WHERE owner = OLD.wallet
        LOOP
            PERFORM update_sol_user_balance_mint(OLD.user_id, v_mint);
        END LOOP;
    END IF;

    RETURN NULL;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'An error occurred in %: %', TG_NAME, SQLERRM;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    CREATE TRIGGER on_associated_wallets
    AFTER INSERT OR UPDATE OR DELETE ON associated_wallets
    FOR EACH ROW EXECUTE PROCEDURE handle_associated_wallets();
EXCEPTION
  WHEN others THEN NULL;
END $$;
COMMENT ON TRIGGER on_associated_wallets ON associated_wallets IS 'Updates sol_user_balances when associated_wallets are added and removed';