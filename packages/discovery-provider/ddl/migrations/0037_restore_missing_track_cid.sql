UPDATE
    tracks
SET
    track_cid = subquery.track_cid
FROM
    (
        SELECT
            tracks.track_id,
            cid_data.data ->> 'track_cid' AS track_cid
        FROM
            tracks
            JOIN users ON (users.user_id = tracks.owner_id)
            JOIN cid_data ON (tracks.metadata_multihash = cid_data.cid)
        WHERE
            tracks.track_cid is NULL
            AND is_delete = false
            AND tracks.is_available = true
            AND users.is_available = true
    ) AS subquery
WHERE
    tracks.track_id = subquery.track_id
    and subquery.track_cid is not null;