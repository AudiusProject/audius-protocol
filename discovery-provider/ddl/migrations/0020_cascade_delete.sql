-- for all tables with is_current
-- use a fkey constraint that cascades delete
-- delete is_current false
begin;

CREATE OR REPLACE FUNCTION drop_fk_constraints(_ref_table_name text)
RETURNS VOID AS
$$
DECLARE
   _constraint_name text;
   _table_name text;
BEGIN
   FOR _constraint_name, _table_name IN
      SELECT conname, conrelid::regclass::text
      FROM   pg_constraint
      WHERE  confrelid = _ref_table_name::regclass
   LOOP
      EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %s', 
                     quote_ident(_table_name), 
                     quote_ident(_constraint_name));
   END LOOP;
END
$$ LANGUAGE plpgsql;
SELECT drop_fk_constraints('blocks');



CREATE OR REPLACE FUNCTION add_fk_constraints_and_delete_rows(_table_names text[])
RETURNS VOID AS
$$
DECLARE
   _table_name text;
BEGIN
   FOREACH _table_name IN ARRAY _table_names
   LOOP
      -- Logging the deletion
      RAISE NOTICE 'Deleting rows from table % where is_current is false', _table_name;

      EXECUTE format('DELETE FROM %s WHERE is_current = false', 
                     quote_ident(_table_name));
      -- Logging the action
      RAISE NOTICE 'Adding foreign key constraint to table %', _table_name;
      
      EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %s FOREIGN KEY (blocknumber) REFERENCES blocks (number) ON DELETE CASCADE', 
                     quote_ident(_table_name), 
                     quote_ident(_table_name || '_blocknumber_fkey'));
                     
   END LOOP;
END
$$ LANGUAGE plpgsql;

SELECT add_fk_constraints_and_delete_rows(ARRAY[
    'associated_wallets', 
    'developer_apps', 
    'follows', 
    'grants', 
    'playlist_routes', 
    'playlists', 
    'playlist_seen', 
    'reposts', 
    'saves', 
    'subscriptions', 
    'track_routes', 
    'tracks', 
    'user_events', 
    'users'
]
);


commit;