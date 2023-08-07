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



CREATE OR REPLACE FUNCTION add_fk_constraints_and_delete_rows(_ref_table_name text, _ref_column_name text, _table_names text[])
RETURNS VOID AS
$$
DECLARE
   _table_name text;
BEGIN
   FOREACH _table_name IN ARRAY _table_names
   LOOP
      EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %s FOREIGN KEY (%s) REFERENCES %s (%s) ON DELETE CASCADE', 
                     quote_ident(_table_name), 
                     quote_ident(_table_name || '_' || _ref_column_name || '_fkey'),
                     quote_ident(_ref_column_name),
                     quote_ident(_ref_table_name),
                     quote_ident(_ref_column_name));

      EXECUTE format('DELETE FROM %s WHERE is_current = false', 
                     quote_ident(_table_name));
   END LOOP;
END
$$ LANGUAGE plpgsql;

SELECT add_fk_constraints_and_delete_rows('blocks', 'blocknumber', ARRAY['app_delegates', 'delegations', 'developer_apps', 'grants', 'users', 'tracks', 'playlists', 'follows', 'saves', 'reposts', 'subscriptions', 'track_price_history']);

