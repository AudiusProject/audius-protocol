CREATE OR REPLACE FUNCTION handle_artist_coins_change()
RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('artist_coins_changed', json_build_object('operation', TG_OP, 'new_mint', NEW.mint, 'old_mint', OLD.mint)::text);
    RETURN NEW;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'An error occurred in %: %', TG_NAME, SQLERRM;
            RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
    CREATE TRIGGER on_artist_coins_change
    AFTER INSERT OR UPDATE OR DELETE ON artist_coins
    FOR EACH ROW EXECUTE FUNCTION handle_artist_coins_change();
EXCEPTION
    WHEN others THEN NULL;  -- Ignore if trigger already exists
END $$;
COMMENT ON TRIGGER on_artist_coins_change ON artist_coins IS 'Notifies when artist coins are added, removed, or updated.'