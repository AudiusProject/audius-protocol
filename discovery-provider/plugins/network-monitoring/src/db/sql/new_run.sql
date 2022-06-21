INSERT INTO network_monitoring_content_nodes (
        SPID,
        ENDPOINT,
        RUN_ID
    )
SELECT CNODE_SP_ID,
    ENDPOINT,
    1
FROM URSM_CONTENT_NODES
WHERE IS_CURRENT = TRUE;

INSERT INTO network_monitoring_users (
        USER_ID,
        WALLET,
        REPLICA_SET,
        RUN_ID,
        PRIMARYSPID,
        SECONDARY1SPID,
        SECONDARY2SPID
    )
SELECT USER_ID,
    WALLET,
    CREATOR_NODE_ENDPOINT AS REPLICA_SET,
    1,
    PRIMARY_ID AS PRIMARYSPID,
    SECONDARY_IDS [0] AS SECONDARY1SPID,
    SECONDARY_IDS [1] AS SECONDARY1SPID
FROM USERS
WHERE IS_CURRENT = TRUE;

INSERT INTO network_monitoring_cids_from_discovery (
        CID,
        RUN_ID,
        CTYPE,
        USER_ID
    )
SELECT 
    METADATA_MULTIHASH,
    1,
    'metadata',
    USER_ID
FROM USERS
WHERE METADATA_MULTIHASH IS NOT NULL
    AND IS_CURRENT = TRUE;

INSERT INTO network_monitoring_cids_from_discovery (
        CID,
        RUN_ID,
        CTYPE,
        USER_ID
    )
SELECT PROFILE_PICTURE,
    1,
    'image',
    USER_ID
FROM USERS
WHERE PROFILE_PICTURE IS NOT NULL
    AND USER_ID IS NOT NULL
    AND IS_CURRENT = TRUE;

INSERT INTO network_monitoring_cids_from_discovery (
        CID,
        RUN_ID,
        CTYPE,
        USER_ID
    )
SELECT PROFILE_PICTURE_SIZES,
    1,
    'dir',
    USER_ID
FROM USERS
WHERE PROFILE_PICTURE_SIZES IS NOT NULL
    AND IS_CURRENT = TRUE;

INSERT INTO network_monitoring_cids_from_discovery (
        CID,
        RUN_ID,
        CTYPE,
        USER_ID
    )
SELECT COVER_PHOTO,
    1,
    'image',
    USER_ID
FROM USERS
WHERE COVER_PHOTO IS NOT NULL
    AND IS_CURRENT = TRUE;

INSERT INTO network_monitoring_cids_from_discovery (
        CID,
        RUN_ID,
        CTYPE,
        USER_ID
    )
SELECT COVER_PHOTO_SIZES,
    1,
    'dir',
    USER_ID
FROM USERS
WHERE COVER_PHOTO_SIZES IS NOT NULL
    AND IS_CURRENT = TRUE;

INSERT INTO network_monitoring_cids_from_discovery (
        CID,
        RUN_ID,
        CTYPE,
        USER_ID
    )
SELECT COVER_ART,
    1,
    'image',
    OWNER_ID
FROM TRACKS
WHERE COVER_ART IS NOT NULL
    AND IS_CURRENT = TRUE;

INSERT INTO network_monitoring_cids_from_discovery (
        CID,
        RUN_ID,
        CTYPE,
        USER_ID
    )
SELECT COVER_ART_SIZES,
    1,
    'dir',
    OWNER_ID
FROM TRACKS
WHERE COVER_ART_SIZES IS NOT NULL
    AND IS_CURRENT = TRUE;

INSERT INTO network_monitoring_cids_from_discovery (
        CID,
        RUN_ID,
        CTYPE,
        USER_ID
    )
SELECT METADATA_MULTIHASH,
    1,
    'metadata',
    OWNER_ID
FROM TRACKS
WHERE METADATA_MULTIHASH IS NOT NULL
    AND IS_CURRENT = TRUE;

INSERT INTO network_monitoring_cids_from_discovery (
        CID,
        RUN_ID,
        CTYPE,
        USER_ID
    )
SELECT DOWNLOAD->'cid' AS CID,
    1,
    'track',
    OWNER_ID
FROM TRACKS
WHERE DOWNLOAD->'cid' != 'null'
    AND IS_CURRENT = TRUE;

INSERT INTO network_monitoring_cids_from_discovery (
        CID,
        RUN_ID,
        CTYPE,
        USER_ID
    )
SELECT JSONB_ARRAY_ELEMENTS(TRACK_SEGMENTS)->'multihash',
    1,
    'track',
    OWNER_ID
FROM TRACKS
WHERE TRACK_SEGMENTS IS NOT NULL
    AND IS_CURRENT = TRUE;