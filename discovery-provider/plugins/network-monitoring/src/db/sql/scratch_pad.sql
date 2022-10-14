
-- tmp file for dev use

CREATE TABLE network_monitoring_users (
    id SERIAL NOT NULL,
    user_id INT NOT NULL,
    wallet TEXT,
    replica_set VARCHAR,

    PRIMARY KEY (id)
);

CREATE TABLE tmp_table (
    user_id INT NOT NULL,
    cid VARCHAR,

    PRIMARY KEY (user_id)
);

INSERT INTO tmp_table (user_id, cid)
SELECT user_id, metadata_multihash
FROM users
WHERE is_current = TRUE;


CREATE TABLE cids_from_dn (
    cid VARCHAR NOT NULL,
    run_id INT,
    user_id INT,
    CONSTRAINT fk_run_id
        FOREIGN KEY (run_id)
        REFERENCES index_blocks(run_id),
    CONSTRAINT fk_user_id 
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),
    
    PRIMARY KEY (cid)
);

CREATE TABLE tmp_cid_table (
    id SERIAL NOT NULL,
    cid VARCHAR NOT NULL,
    user_id INT,

    PRIMARY KEY (id)
);

---

INSERT INTO tmp_cid_table (cid, user_id)
SELECT metadata_multihash, user_id
FROM users
WHERE metadata_multihash IS NOT NULL
AND is_current = TRUE;

INSERT INTO tmp_cid_table (cid, user_id)
SELECT profile_picture, user_id
FROM users
WHERE profile_picture IS NOT NULL
AND is_current = TRUE;

INSERT INTO tmp_cid_table (cid, user_id)
SELECT profile_picture_sizes, user_id
FROM users
WHERE profile_picture_sizes IS NOT NULL
AND is_current = TRUE;

INSERT INTO tmp_cid_table (cid, user_id)
SELECT cover_photo, user_id
FROM users
WHERE cover_photo IS NOT NULL
AND is_current = TRUE;

INSERT INTO tmp_cid_table (cid, user_id)
SELECT cover_photo_sizes, user_id 
FROM users 
WHERE cover_photo_sizes IS NOT NULL
AND is_current = TRUE;

INSERT INTO tmp_cid_table (cid, user_id)
SELECT cover_art, owner_id
FROM tracks
WHERE cover_art IS NOT NULL
AND is_current = TRUE;

INSERT INTO tmp_cid_table (cid, user_id)
SELECT cover_art_sizes, owner_id
FROM tracks 
WHERE cover_art_sizes IS NOT NULL
AND is_current = TRUE;

INSERT INTO tmp_cid_table (cid, user_id)
SELECT metadata_multihash, owner_id
FROM tracks 
WHERE metadata_multihash IS NOT NULL
AND is_current = TRUE;

INSERT INTO tmp_cid_table (cid, user_id)
SELECT download -> 'cid' as cid, owner_id
FROM tracks 
WHERE download -> 'cid' != 'null'
AND is_current = TRUE;

INSERT INTO tmp_cid_table (cid, user_id)
SELECT jsonb_array_elements(track_segments) -> 'multihash', owner_id
FROM tracks
WHERE track_segments IS NOT NULL
AND is_current = TRUE;


-- 

-- Get the size of cids
cid_count = SELECT COUNT(*) FROM network_monitoring_cids_from_discovery;

SELECT cid, unnested(string_to_array(replica_set))
FROM network_monitoring_cids_from_discovery
JOIN network_monitoring_users
ON network_monitoring_cids_from_discovery.user_id = network_monitoring_users.user_id;


SELECT endpoint FROM network_monitoring_content_nodes;

SELECT COUNT(subquery.cid) as cid_count, subquery.content_node as endpoint
FROM (
    SELECT cid, unnest(string_to_array(replica_set, ',')) AS content_node
    FROM network_monitoring_cids_from_discovery
    JOIN network_monitoring_users
    ON network_monitoring_cids_from_discovery.user_id = network_monitoring_users.user_id
) AS subquery
GROUP BY subquery.content_node;

SELECT wallet 
FROM network_monitoring_users
WHERE run_id = 1
AND primarySpID = 'https://creatornode7.staging.audius.co';

SELECT primary_group.spid as spid, primary_count, secondary1_count, secondary2_count
FROM (
    (
        SELECT primaryspid AS spid, COUNT(*) AS primary_count
        FROM network_monitoring_users 
        WHERE run_id = 1 
        GROUP BY primaryspid
    ) as primary_group
    JOIN 
    (
        SELECT secondary1spid AS spid, COUNT(*) AS secondary1_count 
        FROM network_monitoring_users 
        WHERE run_id = 1 
        GROUP BY secondary1spid
    ) secondary1_group
    ON primary_group.spid = secondary1_group.spid
    JOIN
    (
        SELECT secondary2spid AS spid, COUNT(*) AS secondary2_count 
        FROM network_monitoring_users 
        WHERE run_id = 1 
        GROUP BY secondary2spid
    ) secondary2_group
    ON primary_group.spid = secondary2_group.spid
);

SELECT prejoin.cid_count, cnodes.spid, cnodes.endpoint 
FROM (
    (
        SELECT COUNT(subquery.cid) as cid_count, subquery.spid as spid
        FROM (
            SELECT cid, ctype, unnest(array [primaryspid, secondary1spid, secondary2spid]) AS spid
            FROM (SELECT * FROM network_monitoring_cids_from_discovery WHERE run_id = 1 AND ctype != 'image') AS cids_current_run
            RIGHT JOIN (SELECT * FROM network_monitoring_users WHERE run_id = 1) AS users_current_run
            ON cids_current_run.user_id = users_current_run.user_id
        ) AS subquery
        WHERE subquery.spid IS NOT NULL
        GROUP BY subquery.spid
    ) AS prejoin
    JOIN 
    (
        SELECT * FROM network_monitoring_content_nodes WHERE run_id = 1
    ) AS cnodes
    ON cnodes.spid = prejoin.spid
) 
ORDER BY cnodes.spid;



SELECT joined.endpoint, COUNT(*) 
FROM (
    (SELECT * FROM network_monitoring_content_nodes WHERE run_id = 1) AS cnodes
JOIN
(
    SELECT user_id, unnest(string_to_array(replica_set, ',')) AS user_endpoint 
    FROM network_monitoring_users
    WHERE run_id = 1
) as unnested_users
ON
    cnodes.endpoint = unnested_users.user_endpoint
) AS joined
GROUP BY 
    joined.endpoint;


SELECT 
    joined.endpoint, COUNT(*) 
FROM (
    (SELECT * FROM network_monitoring_users WHERE run_id = 1) AS current_users
JOIN
    (SELECT * FROM network_monitoring_content_nodes WHERE run_id = 1) AS cnodes
ON
    current_users.primaryspid = cnodes.spid
) AS joined
GROUP BY 
    joined.endpoint;


SELECT user_id
FROM network_monitoring_users
WHERE
    run_id = 1
AND
    primary_clock_value = secondary1_clock_value
AND
    secondary1_clock_value = secondary2_clock_value;

SELECT primary_group.spid as spid, primary_count, secondary1_count, secondary2_count
        FROM (
            (
                SELECT primaryspid AS spid, COUNT(*) AS primary_count
                FROM network_monitoring_users 
                WHERE run_id = 1
                GROUP BY primaryspid
            ) as primary_group
            JOIN 
            (
                SELECT secondary1spid AS spid, COUNT(*) AS secondary1_count 
                FROM network_monitoring_users 
                WHERE run_id = 1
                GROUP BY secondary1spid
            ) secondary1_group
            ON primary_group.spid = secondary1_group.spid
            JOIN
            (
                SELECT secondary2spid AS spid, COUNT(*) AS secondary2_count 
                FROM network_monitoring_users 
                WHERE run_id = 1
                GROUP BY secondary2spid
            ) secondary2_group
            ON primary_group.spid = secondary2_group.spid
        )
        WHERE primary_group.spid = 8;

        UPDATE network_monitoring_users
                    SET secondary1_clock_value = 1
                    WHERE wallet = '0xfa605045d2b861b1869b4f8939a8a81f9343bc8b'
                    AND run_id = 1;

 SELECT wallet 
        FROM network_monitoring_users
        WHERE run_id = 45
        AND primaryspid = 6
        AND wallet > '0x1234567'
        ORDER BY wallet
        LIMIT 5000;

UPDATE network_monitoring_users
SET primary_clock_value = :clock
WHERE wallet = :walletPublicKey
AND run_id = :run_id;

   SELECT COUNT(*) as user_count
    FROM network_monitoring_users
    WHERE
        run_id = 103
    AND 
        primaryspid = ANY ( '{1,2,3,4}'::int[] )
    AND
        secondary1spid = ANY ( '{1,2,3,4}'::int[] )
    AND 
        secondary2spid = ANY ( '{1,2,3,4}'::int[] );

SELECT COUNT(*) as user_count
    FROM network_monitoring_users
    WHERE
        run_id = 71
    AND 
        primaryspid != ALL('{1, 2, 3, 4, 5, 6, 7, 8, 9}'::int[])
    AND
        secondary1spid != ALL('{1, 2, 3, 4, 5, 6, 7, 8, 9}'::int[])
    AND 
        secondary2spid != ALL ('{1, 2, 3, 4, 5, 6, 7, 8, 9}'::int[]);

-- FULLY SYNCED

SELECT 
    fully_synced.spid, 
    cnodes.endpoint, 
    fully_synced.fully_synced_count + 
    partially_synced.partially_synced_count + 
    unsynced.unsynced_count

SELECT 
    SUM(fully_synced.fully_synced_count + 
    partially_synced.partially_synced_count + 
    unsynced.unsynced_count) AS WHOA
FROM (
    SELECT 
        fully_synced_primary.spid AS spid, 
        (SUM(fully_synced_primary.fully_synced_count) +
        SUM(fully_synced_secondary1.fully_synced_count) +
        SUM(fully_synced_secondary2.fully_synced_count)) AS fully_synced_count
    FROM (
        SELECT primaryspid AS spid, COUNT(*) as fully_synced_count
        FROM network_monitoring_users
        WHERE
            run_id = 121
        AND 
            primary_clock_value IS NOT NULL
        AND
            primary_clock_value = secondary1_clock_value
        AND
            secondary1_clock_value = secondary2_clock_value
        GROUP BY primaryspid
    ) AS fully_synced_primary
    JOIN (
        SELECT secondary1spid AS spid, COUNT(*) as fully_synced_count
        FROM network_monitoring_users
        WHERE
            run_id = 121
        AND 
            primary_clock_value IS NOT NULL
        AND
            primary_clock_value = secondary1_clock_value
        AND
            secondary1_clock_value = secondary2_clock_value
        GROUP BY secondary1spid
    ) AS fully_synced_secondary1
    ON fully_synced_primary.spid = fully_synced_secondary1.spid
    JOIN (
        SELECT secondary2spid AS spid, COUNT(*) as fully_synced_count
        FROM network_monitoring_users
        WHERE
            run_id = 121
        AND 
            primary_clock_value IS NOT NULL
        AND
            primary_clock_value = secondary1_clock_value
        AND
            secondary1_clock_value = secondary2_clock_value
        GROUP BY secondary2spid
    ) AS fully_synced_secondary2
    ON fully_synced_primary.spid = fully_synced_secondary2.spid
    GROUP BY fully_synced_primary.spid
) AS fully_synced
JOIN (
    SELECT 
        partially_synced_primary.spid AS spid, 
        (SUM(partially_synced_primary.partially_synced_count) +
        SUM(partially_synced_secondary1.partially_synced_count) +
        SUM(partially_synced_secondary2.partially_synced_count)) AS partially_synced_count
    FROM (
        SELECT primaryspid AS SPID, COUNT(*) AS partially_synced_count
        FROM network_monitoring_users
        WHERE 
            run_id = 121
        AND 
            primary_clock_value IS NOT NULL
        AND ( 
            primary_clock_value = secondary1_clock_value
            OR
            primary_clock_value = secondary2_clock_value
        )
        AND 
            secondary1_clock_value != secondary2_clock_value
        GROUP BY primaryspid
    ) AS partially_synced_primary
    JOIN (
        SELECT secondary1spid AS SPID, COUNT(*) AS partially_synced_count
        FROM network_monitoring_users
        WHERE 
            run_id = 121
        AND 
            primary_clock_value IS NOT NULL
        AND ( 
            primary_clock_value = secondary1_clock_value
            OR
            primary_clock_value = secondary2_clock_value
        )
        AND 
            secondary1_clock_value != secondary2_clock_value
        GROUP BY secondary1spid
    ) AS partially_synced_secondary1
    ON partially_synced_primary.spid = partially_synced_secondary1.spid
    JOIN (
        SELECT secondary2spid AS SPID, COUNT(*) AS partially_synced_count
        FROM network_monitoring_users
        WHERE 
            run_id = 121
        AND 
            primary_clock_value IS NOT NULL
        AND ( 
            primary_clock_value = secondary1_clock_value
            OR
            primary_clock_value = secondary2_clock_value
        )
        AND 
            secondary1_clock_value != secondary2_clock_value
        GROUP BY secondary2spid
    ) AS partially_synced_secondary2
    ON partially_synced_primary.spid = partially_synced_secondary2.spid
    GROUP BY partially_synced_primary.spid
) AS partially_synced
ON fully_synced.spid = partially_synced.spid
JOIN (
    SELECT 
        unsynced_primary.spid AS spid, 
        (SUM(unsynced_primary.unsynced_count) +
        SUM(unsynced_secondary1.unsynced_count) +
        SUM(unsynced_secondary2.unsynced_count)) AS unsynced_count
    FROM (
        SELECT primaryspid AS spid, COUNT(*) AS unsynced_count
        FROM network_monitoring_users
        WHERE 
            run_id = 121
        AND 
            primary_clock_value IS NOT NULL
        AND 
            primary_clock_value != secondary1_clock_value
        AND
            primary_clock_value != secondary2_clock_value
        GROUP BY primaryspid
    ) AS unsynced_primary
    JOIN (
        SELECT secondary1spid AS spid, COUNT(*) AS unsynced_count
        FROM network_monitoring_users
        WHERE 
            run_id = 121
        AND 
            primary_clock_value IS NOT NULL
        AND 
            primary_clock_value != secondary1_clock_value
        AND
            primary_clock_value != secondary2_clock_value
        GROUP BY secondary1spid
    ) AS unsynced_secondary1
    ON unsynced_primary.spid = unsynced_secondary1.spid
    JOIN (
        SELECT secondary2spid AS spid, COUNT(*) AS unsynced_count
        FROM network_monitoring_users
        WHERE 
            run_id = 121
        AND 
            primary_clock_value IS NOT NULL
        AND 
            primary_clock_value != secondary1_clock_value
        AND
            primary_clock_value != secondary2_clock_value
        GROUP BY secondary2spid
    ) AS unsynced_secondary2
    ON unsynced_primary.spid = unsynced_secondary2.spid
    GROUP BY unsynced_primary.spid
) AS unsynced
ON fully_synced.spid = unsynced.spid
JOIN (
    SELECT spid, endpoint
    FROM network_monitoring_content_nodes
    WHERE
        run_id = 121
) AS cnodes
ON cnodes.spid = fully_synced.spid
-- ORDER BY fully_synced.spid;

SELECT COUNT(*) as user_count
    FROM network_monitoring_users
    WHERE 
        run_id = 168
    AND (
        primary_clock_value = -1
        OR
        secondary1_clock_value = -1
        OR 
        secondary2_clock_value = -1
    );