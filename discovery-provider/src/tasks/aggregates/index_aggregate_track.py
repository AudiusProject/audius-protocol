import logging

from src.tasks.aggregates import try_updating_aggregate_table, update_aggregate_table
from src.tasks.celery_app import celery
from src.tasks.index_aggregate_user import get_latest_blocknumber

logger = logging.getLogger(__name__)

AGGREGATE_TRACK = "aggregate_track"

# UPDATE_AGGREGATE_TRACK_QUERY
# Get a lower bound blocknumber to check for new save/repost activity
# Find a subset of tracks that have changed after that blocknumber
# For that subset of tracks calculate the play/repost total counts
# Insert that count for new users or update an existing row
UPDATE_AGGREGATE_TRACK_QUERY = """
    WITH new_track AS (
        SELECT
            t.track_id AS track_id
        FROM
            tracks t
        WHERE
            t.is_current IS TRUE
            AND t.blocknumber > :prev_blocknumber
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
                AND r.is_delete IS FALSE
                AND r.blocknumber > :prev_blocknumber
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
                AND s.is_delete IS FALSE
                AND s.blocknumber > :prev_blocknumber
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
                    d.is_delete IS TRUE
                    AND d.blocknumber > :prev_blocknumber
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
    """


def _update_aggregate_track(session):
    current_blocknumber = get_latest_blocknumber(session)

    update_aggregate_table(
        logger,
        session,
        AGGREGATE_TRACK,
        UPDATE_AGGREGATE_TRACK_QUERY,
        "blocknumber",
        current_blocknumber,
    )


# ####### CELERY TASKS ####### #
@celery.task(name="update_aggregate_track", bind=True)
def update_aggregate_track(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    db = update_aggregate_track.db
    redis = update_aggregate_track.redis

    try_updating_aggregate_table(
        logger, db, redis, AGGREGATE_TRACK, _update_aggregate_track
    )
