TRUNCATE TABLE playlist_routes;
INSERT INTO playlist_routes (
                playlist_id
                , owner_id
                , slug
                , title_slug
                , collision_id
                , is_current
                , blockhash
                , blocknumber
                , txhash
            )
            SELECT
                playlist_id
                , playlist_owner_id
                , CONCAT(REPLACE(LOWER(playlist_name), ' ', '-'),  '-', playlist_id)
                    AS slug
                , CONCAT(REPLACE(LOWER(playlist_name), ' ', '-'),  '-', playlist_id)
                    AS title_slug
                , 0 AS collision_id
                , is_current
                , blockhash
                , blocknumber
                , txhash
            FROM playlists
            WHERE is_current
            GROUP BY
                playlist_owner_id
                , playlist_id
                , playlist_name
                , is_current
                , blockhash
                , blocknumber
                , txhash;

INSERT INTO playlist_routes (
                playlist_id
                , owner_id
                , slug
                , title_slug
                , collision_id
                , is_current
                , blockhash
                , blocknumber
                , txhash
            )
            SELECT
                p.playlist_id
                , p.playlist_owner_id
                , p.slug
                , p.title_slug
                , p.collision_id
                , p.is_current
                , p.blockhash
                , p.blocknumber
                , p.txhash
            FROM (
                SELECT
                    nc.playlist_id
                    , nc.playlist_owner_id
                    , CONCAT(REPLACE(LOWER(nc.playlist_name), ' ', '-'),  '-', nc.playlist_id) AS slug
                    , CONCAT(REPLACE(LOWER(nc.playlist_name), ' ', '-'),  '-', nc.playlist_id) AS title_slug
                    , 0 AS collision_id
                    , nc.is_current
                    , nc.blockhash
                    , nc.blocknumber
                    , nc.txhash
                    , ROW_NUMBER() OVER (
                            PARTITION BY nc.playlist_name
                            ORDER BY nc.blocknumber DESC
                        ) AS rank
                FROM playlists AS c_playlists
                JOIN playlists AS nc
                ON c_playlists.playlist_id = nc.playlist_id
                WHERE NOT nc.is_current
                AND c_playlists.is_current
                AND NOT LOWER(nc.playlist_name) = LOWER(c_playlists.playlist_name)
            ) p
            WHERE p.rank = 1
            ON CONFLICT DO NOTHING;