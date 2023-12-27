-- Drop is_current from any primary keys or indices with is_current
-- Improves performance and storage utilization
BEGIN;
SELECT pg_cancel_backend(pid) FROM pg_stat_activity WHERE state = 'active' and pid <> pg_backend_pid();

LOCK TABLE grants IN ACCESS EXCLUSIVE MODE;
LOCK TABLE users IN ACCESS EXCLUSIVE MODE;
LOCK TABLE playlist_seen IN ACCESS EXCLUSIVE MODE;
LOCK TABLE subscriptions IN ACCESS EXCLUSIVE MODE;
LOCK TABLE tracks IN ACCESS EXCLUSIVE MODE;
LOCK TABLE follows IN ACCESS EXCLUSIVE MODE;
LOCK TABLE saves IN ACCESS EXCLUSIVE MODE;
LOCK TABLE developer_apps IN ACCESS EXCLUSIVE MODE;
LOCK TABLE playlists IN ACCESS EXCLUSIVE MODE;
LOCK TABLE user_events IN ACCESS EXCLUSIVE MODE;
LOCK TABLE associated_wallets IN ACCESS EXCLUSIVE MODE;
LOCK TABLE playlist_routes IN ACCESS EXCLUSIVE MODE;

DO $$ 
DECLARE
    v_table_name text;
    v_constraint_name text;
    v_columns text;
    drop_constraint_sql text;
    create_constraint_sql text;
BEGIN
    FOR v_table_name, v_constraint_name, v_columns IN (
        SELECT table_name, constraint_name, array_to_string(array_remove(a.constraint_columns, 'is_current'), ', ')
        FROM (
            SELECT
                table_name,
                constraint_name,
                array_agg(column_name) AS constraint_columns
            FROM information_schema.key_column_usage
            GROUP BY table_name, constraint_name
        ) a
        WHERE 'is_current' = ANY(SELECT UNNEST(a.constraint_columns))
        --         table_name   |   constraint_name   |               array_to_string                
        -- ----------------+---------------------+----------------------------------------------
        -- grants         | grants_pkey         | grantee_address, user_id, txhash
        -- users          | users_new_pkey      | user_id, txhash
        -- reposts        | reposts_new_pkey    | user_id, repost_item_id, repost_type, txhash
        -- playlist_seen  | playlist_seen_pkey  | user_id, playlist_id, seen_at
        -- subscriptions  | subscriptions_pkey  | subscriber_id, user_id, txhash
        -- tracks         | tracks_pkey         | track_id, txhash
        -- follows        | follows_pkey        | follower_user_id, followee_user_id, txhash
        -- saves          | saves_new_pkey      | user_id, save_item_id, save_type, txhash
        -- developer_apps | developer_apps_pkey | address, txhash
        -- playlists      | playlists_pkey      | playlist_id, txhash
    )
    LOOP
        drop_constraint_sql := 'ALTER TABLE ' || v_table_name || ' DROP CONSTRAINT ' || v_constraint_name || ';';
        create_constraint_sql := 'ALTER TABLE ' || v_table_name || ' ADD PRIMARY KEY (' || v_columns || ');';
        
        RAISE NOTICE 'Dropping and recreating primary key for table %', v_table_name;
        RAISE NOTICE 'Drop SQL: %', drop_constraint_sql;
        RAISE NOTICE 'Create SQL: %', create_constraint_sql;
        
        -- Uncomment the next two lines to actually execute the drop and recreate SQL statements
        EXECUTE drop_constraint_sql;
        EXECUTE create_constraint_sql;
    END LOOP;
END $$;

-- don't need this index anymore "users_new_created_at_user_id_idx" btree (created_at, user_id) WHERE is_current 
DROP INDEX IF EXISTS users_new_created_at_user_id_idx;

DROP INDEX IF EXISTS track_is_premium_idx;
CREATE INDEX track_is_premium_idx ON public.tracks USING btree (is_premium, is_delete);

DROP INDEX IF EXISTS users_new_is_deactivated_is_current_handle_lc_is_available_idx;
CREATE INDEX users_new_is_deactivated_handle_lc_is_available_idx ON public.users USING btree (is_deactivated, handle_lc, is_available) WHERE ((is_deactivated = false) AND (handle_lc IS NOT NULL) AND (is_available = true));

DROP INDEX IF EXISTS public.tracks_ai_attribution_user_id;
CREATE INDEX tracks_ai_attribution_user_id ON public.tracks USING btree (ai_attribution_user_id) WHERE (ai_attribution_user_id IS NOT NULL);

DROP INDEX IF EXISTS public.follows_inbound_idx;
CREATE INDEX follows_inbound_idx ON public.follows USING btree (followee_user_id, follower_user_id, is_delete);

DROP INDEX IF EXISTS public.tracks_track_cid_idx;
CREATE INDEX tracks_track_cid_idx ON public.tracks USING btree (track_cid, is_delete);

DROP INDEX IF EXISTS public.user_events_user_id_idx;
CREATE INDEX user_events_user_id_idx ON public.user_events USING btree (user_id);

DROP INDEX IF EXISTS public.track_routes_track_id_idx;
CREATE INDEX track_routes_track_id_idx ON public.track_routes USING btree (track_id);

DROP INDEX IF EXISTS public.fix_tracks_top_genre_users_idx;
CREATE INDEX fix_tracks_top_genre_users_idx ON public.tracks USING btree (track_id, owner_id, genre, is_unlisted, is_delete) WHERE (stem_of IS NULL);

DROP INDEX IF EXISTS public.ix_associated_wallets_user_id;
CREATE INDEX ix_associated_wallets_user_id ON public.associated_wallets USING btree (user_id);

DROP INDEX IF EXISTS public.ix_associated_wallets_wallet;
CREATE INDEX ix_associated_wallets_wallet ON public.associated_wallets USING btree (wallet);

DROP INDEX IF EXISTS public.fix_tracks_status_flags_idx;
CREATE INDEX fix_tracks_status_flags_idx ON public.tracks USING btree (track_id, is_unlisted, is_delete);

DROP INDEX IF EXISTS public.playlist_routes_playlist_id_idx;
CREATE INDEX playlist_routes_playlist_id_idx ON public.playlist_routes USING btree (playlist_id);

COMMIT;