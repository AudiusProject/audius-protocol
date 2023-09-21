-- delete is_current false
-- add fkey cascade delete
begin;
SELECT pg_cancel_backend(pid) FROM pg_stat_activity WHERE state = 'active' and pid <> pg_backend_pid();

CREATE OR REPLACE FUNCTION drop_fk_constraints(_table_names text[])
RETURNS VOID AS
$$
DECLARE
   _table_name text;
BEGIN
   FOREACH _table_name IN ARRAY _table_names
   LOOP
      RAISE NOTICE 'Dropping foreign key constraint to table %', _table_name;
      EXECUTE format('LOCK TABLE %s IN ACCESS EXCLUSIVE MODE', 
                     quote_ident(_table_name));

      EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %s', 
                     quote_ident(_table_name), 
                     quote_ident(_table_name || '_blocknumber_fkey'));

   END LOOP;
END
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION delete_rows(_table_names text[])
RETURNS VOID AS
$$
DECLARE
   _table_name text;
BEGIN
   FOREACH _table_name IN ARRAY _table_names
   LOOP
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

SELECT drop_fk_constraints(ARRAY[
    'associated_wallets', 
    'developer_apps', 
    'follows', 
    'grants', 
    'playlists', 
    'playlist_seen',
    'notification_seen',
    'subscriptions', 
    'tracks', 
    'user_events']
);

SELECT delete_rows(ARRAY[
    'associated_wallets', 
    'developer_apps', 
    'follows', 
    'grants', 
    'playlists', 
    'playlist_seen', 
    'subscriptions', 
    'tracks', 
    'user_events']
);

SELECT add_fk_constraints(ARRAY[
    'associated_wallets', 
    'developer_apps', 
    'follows', 
    'grants', 
    'playlists', 
    'playlist_seen',
    'notification_seen',
    'subscriptions', 
    'tracks', 
    'user_events'
]
);

commit;