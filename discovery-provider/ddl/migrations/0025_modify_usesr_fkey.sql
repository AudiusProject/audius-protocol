begin;

-- add cascading deletes to users table
-- when a block is deleted from the blocks table, user rows referencing this will be deleted as well
CREATE OR REPLACE FUNCTION modify_fk_constraints(_table_names text[])
RETURNS VOID AS
$$
DECLARE
    _table_name text;
    v_constraint_name text;
BEGIN
    FOREACH _table_name IN ARRAY _table_names
    LOOP
        -- Drop existing foreign key constraints
        -- Loop because some tables have duplicate extra constraints like blockhash
        FOR v_constraint_name IN 
            SELECT conname
            FROM pg_constraint 
            INNER JOIN pg_class ON conrelid=pg_class.oid 
            INNER JOIN pg_namespace ON pg_class.relnamespace=pg_namespace.oid 
            WHERE relname = _table_name AND confrelid != 0
        LOOP
            RAISE NOTICE 'Dropping foreign key constraint % on table %', v_constraint_name, _table_name;
            EXECUTE 'ALTER TABLE ' || _table_name || ' DROP CONSTRAINT IF EXISTS ' || v_constraint_name;
        END LOOP;

        -- Add new foreign key constraints
        RAISE NOTICE 'Adding foreign key constraint to table %', _table_name;
        EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %s FOREIGN KEY (blocknumber) REFERENCES blocks (number) ON DELETE CASCADE', 
                        quote_ident(_table_name), 
                        quote_ident(_table_name || '_blocknumber_fkey'));
    END LOOP;
END
$$ LANGUAGE plpgsql;

SELECT modify_fk_constraints(ARRAY['users']);

commit;