CREATE EXTENSION IF NOT EXISTS amcheck;

DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN SELECT indexrelid::regclass AS index_name FROM pg_index WHERE indisvalid LOOP
        RAISE NOTICE 'Checking index: %', rec.index_name;
        BEGIN
            -- Attempt to check the index
            PERFORM bt_index_check(rec.index_name);
        EXCEPTION WHEN OTHERS THEN
            -- If an error occurs (indicating a potentially invalid index), reindex it
            RAISE NOTICE 'Reindexing due to error in index: %', rec.index_name;
            EXECUTE 'REINDEX INDEX ' || rec.index_name;
            -- Log that reindexing is complete
            RAISE NOTICE 'Reindexing completed for index: %', rec.index_name;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
