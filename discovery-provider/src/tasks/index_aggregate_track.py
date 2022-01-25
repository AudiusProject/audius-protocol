import logging

from src.tasks.celery_app import aggregate_worker, celery, celery_worker
from src.tasks.index_aggregate_user import get_latest_blocknumber

logger = logging.getLogger(__name__)

AGGREGATE_TRACK = "aggregate_track"

# UPDATE_AGGREGATE_TRACK_QUERY
# Get a lower/higher bound blocknumber to check for new save/repost activity
# Find a subset of tracks that have changed within that blocknumber range
# For that subset of tracks add the play/repost counts to the existing counts
# Insert that count for new users or update it to an existing row
UPDATE_AGGREGATE_TRACK_QUERY = """
    WITH aggregate_track_checkpoints AS (
        SELECT
            :current_blocknumber AS current_blocknumber
    ),
    new_track AS (
        SELECT
            t.track_id AS track_id
        FROM
            tracks t
        WHERE
            t.is_current IS TRUE
            -- AND t.is_delete IS FALSE
            -- AND t.is_unlisted IS FALSE
            -- AND t.stem_of IS NULL
            AND t.blocknumber <= (
                SELECT
                    current_blocknumber
                FROM
                    aggregate_track_checkpoints
            )
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
                -- AND r.is_delete IS FALSE
                AND r.blocknumber <= (
                    SELECT
                        current_blocknumber
                    FROM
                        aggregate_track_checkpoints
                )
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
                AND s.blocknumber <= (
                    SELECT
                        current_blocknumber
                    FROM
                        aggregate_track_checkpoints
                )
            GROUP BY
                s.save_item_id
        )
    )
    INSERT INTO
        aggregate_track (track_id, repost_count, save_count)
    SELECT
        DISTINCT(t.track_id),
        COALESCE(track_repost.repost_count, 0) AS repost_count,
        COALESCE(track_save.save_count, 0) AS save_count
    FROM
        (
            SELECT
                t.track_id
            FROM
                tracks t
            WHERE
                t.is_current IS TRUE
                AND t.is_delete IS FALSE
                AND t.stem_of IS NULL
            GROUP BY
                t.track_id
        ) AS t
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
                AND r.blocknumber <= (
                    SELECT
                        current_blocknumber
                    FROM
                        aggregate_track_checkpoints
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
                AND s.blocknumber <= (
                    SELECT
                        current_blocknumber
                    FROM
                        aggregate_track_checkpoints
                )
            GROUP BY
                s.save_item_id
        ) AS track_save ON track_save.track_id = t.track_id
    WHERE
        t.track_id in (
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

    aggregate_worker(
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

    celery_worker(logger, db, redis, AGGREGATE_TRACK, _update_aggregate_track)
