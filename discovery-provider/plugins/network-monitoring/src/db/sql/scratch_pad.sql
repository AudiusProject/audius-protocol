
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