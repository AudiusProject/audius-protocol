-- delete is_current false
begin;

CREATE OR REPLACE FUNCTION drop_fk_constraints(_ref_table_names text[])
RETURNS VOID AS
$$
DECLARE
   _constraint_name text;
   _table_name text;
BEGIN
   FOR _table_name IN SELECT unnest(_ref_table_names) AS table_name
   LOOP
      FOR _constraint_name IN
         SELECT conname
         FROM   pg_constraint
         WHERE  confrelid = _table_name::regclass
         AND    conrelid::regclass::text <> 'revert_blocks' -- exclude revert_blocks since its constraint is correct
      LOOP
         EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %s', 
                        quote_ident(_table_name), 
                        quote_ident(_constraint_name));
      END LOOP;
   END LOOP;
END
$$ LANGUAGE plpgsql;


SELECT drop_fk_constraints(ARRAY[
    'developer_apps', 
    'follows', 
    'grants', 
    'playlists', 
    'playlist_seen', 
    'reposts', 
    'saves', 
    'subscriptions', 
    'tracks']
);



CREATE OR REPLACE FUNCTION delete_rows(_table_names text[])
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

   END LOOP;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_fk_constraints(_table_names text[])
RETURNS VOID AS
$$
DECLARE
   _table_name text;
BEGIN
   FOREACH _table_name IN ARRAY _table_names
   LOOP
      -- Logging the action
      RAISE NOTICE 'Adding foreign key constraint to table %', _table_name;

      EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %s FOREIGN KEY (blocknumber) REFERENCES blocks (number) ON DELETE CASCADE', 
                     quote_ident(_table_name), 
                     quote_ident(_table_name || '_blocknumber_fkey'));

   END LOOP;
END
$$ LANGUAGE plpgsql;


SELECT delete_rows(ARRAY[
    'associated_wallets', 
    'developer_apps', 
    'follows', 
    'grants', 
    'playlists', 
    'playlist_seen', 
    'reposts', 
    'saves', 
    'subscriptions', 
    'tracks', 
    'user_events', 
    'users'
]
);

SELECT add_fk_constraints(ARRAY[
    'associated_wallets', 
    'developer_apps', 
    'follows', 
    'grants', 
    'playlists', 
    'playlist_seen', 
    'reposts', 
    'saves', 
    'subscriptions', 
    'tracks', 
    'user_events', 
    'users'
]
);

commit;