-- delete is_current false
-- for now, only delete associated_wallets and user_events
-- these tables do not have is_current in the pkey so re-inserting a prev record would have conflicts
begin;

CREATE OR REPLACE FUNCTION delete_is_current_false_rows(_table_names text[])
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

SELECT delete_is_current_false_rows(ARRAY[
    'associated_wallets', 
    'user_events'
]
);



commit;