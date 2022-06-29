
alter table aggregate_track alter column repost_count set default 0;
alter table aggregate_track alter column save_count set default 0;


WITH 
aggregate_track_latest_blocknumber AS (
  select last_checkpoint as blocknumber from indexing_checkpoints where tablename = 'aggregate_track'
),
new_track AS (
    SELECT
        t.track_id AS track_id
    FROM
        tracks t
    WHERE
        t.is_current IS TRUE
        AND t.is_delete IS FALSE
        AND t.blocknumber > (select blocknumber from aggregate_track_latest_blocknumber)
    GROUP BY
        t.track_id
    UNION
    ALL (
        SELECT
            r.repost_item_id AS track_id
        FROM
            reposts r
        WHERE
            r.is_current IS TRUE
            AND r.repost_type = 'track'
            AND r.blocknumber > (select blocknumber from aggregate_track_latest_blocknumber)
        GROUP BY
            r.repost_item_id
    )
    UNION
    ALL (
        SELECT
            s.save_item_id AS track_id
        FROM
            saves s
        WHERE
            s.is_current IS TRUE
            AND s.save_type = 'track'
            AND s.blocknumber > (select blocknumber from aggregate_track_latest_blocknumber)
        GROUP BY
            s.save_item_id
    )
),
deleted_tracks AS (
    DELETE FROM
        aggregate_track a
    WHERE
        a.track_id IN (
            SELECT
                track_id
            FROM
                tracks d
            WHERE
                d.is_current IS TRUE
                AND d.is_delete IS TRUE
                AND d.blocknumber > (select blocknumber from aggregate_track_latest_blocknumber)
        )
)
INSERT INTO
    aggregate_track (track_id, repost_count, save_count)
SELECT
    DISTINCT(t.track_id),
    COALESCE(track_repost.repost_count, 0) AS repost_count,
    COALESCE(track_save.save_count, 0) AS save_count
FROM
    tracks t
    LEFT OUTER JOIN (
        SELECT
            r.repost_item_id AS track_id,
            count(r.repost_item_id) AS repost_count
        FROM
            reposts r
        WHERE
            r.is_current IS TRUE
            AND r.repost_type = 'track'
            AND r.is_delete IS FALSE
            AND r.repost_item_id IN (
                SELECT
                    track_id
                FROM
                    new_track
            )
        GROUP BY
            r.repost_item_id
    ) AS track_repost ON track_repost.track_id = t.track_id
    LEFT OUTER JOIN (
        SELECT
            s.save_item_id AS track_id,
            count(s.save_item_id) AS save_count
        FROM
            saves s
        WHERE
            s.is_current IS TRUE
            AND s.save_type = 'track'
            AND s.is_delete IS FALSE
            AND s.save_item_id IN (
                SELECT
                    track_id
                FROM
                    new_track
            )
        GROUP BY
            s.save_item_id
    ) AS track_save ON track_save.track_id = t.track_id
WHERE
    t.is_current is TRUE
    AND t.is_delete IS FALSE
    AND t.track_id in (
        SELECT
            track_id
        FROM
            new_track
    ) ON CONFLICT (track_id) DO
UPDATE
SET
    repost_count = EXCLUDED.repost_count,
    save_count = EXCLUDED.save_count
;