import logging
import time
import sqlalchemy as sa
from src.tasks.celery_app import celery
from src.utils.redis_constants import (
    most_recent_indexed_aggregate_user_block_redis_key,
    most_recent_indexed_block_redis_key
)

logger = logging.getLogger(__name__)

# Names of the aggregate tables to update
AGGREGATE_USER = "aggregate_user_table"
AGGREGATE_TRACK = "aggregate_track"
AGGREGATE_PLAYLIST = "aggregate_playlist"

DEFAULT_UPDATE_TIMEOUT = 60


def update_view(mat_view_name, db):
    with db.scoped_session() as session:
        start_time = time.time()
        logger.info(f"index_aggregate_views.py | Updating {mat_view_name}")
        session.execute(f"REFRESH MATERIALIZED VIEW CONCURRENTLY {mat_view_name}")
        logger.info(
            f"index_aggregate_views.py | Finished updating {mat_view_name} in: {time.time()-start_time} sec"
        )


def update_materialized_view(db, redis, mat_view_name, timeout=DEFAULT_UPDATE_TIMEOUT):
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock(f"refresh_mat_view:{mat_view_name}", timeout=timeout)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            update_view(mat_view_name, db)
        else:
            logger.info(
                f"index_aggregate_views.py | Failed to acquire lock refresh_mat_view:{mat_view_name}"
            )
    except Exception as e:
        logger.error(
            "index_aggregate_views.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()

def update_aggregate_table(
    db, redis, table_name, most_recent_indexed_aggregate_block_key,
    query, timeout=DEFAULT_UPDATE_TIMEOUT
):

    have_lock = False
    update_lock = redis.lock(f"refresh_aggregate_table:{table_name}", timeout=timeout)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            most_recent_indexed_aggregate_block = redis.get(most_recent_indexed_aggregate_block_key)
            if most_recent_indexed_aggregate_block:
                most_recent_indexed_aggregate_block = int(most_recent_indexed_aggregate_block)

            latest_indexed_block_num = redis.get(most_recent_indexed_block_redis_key)
            if latest_indexed_block_num:
                latest_indexed_block_num = int(latest_indexed_block_num)

            with db.scoped_session() as session:
                start_time = time.time()
                if not most_recent_indexed_aggregate_block:
                    # re-create entire table
                    most_recent_indexed_aggregate_block = 0
                    session.execute("TRUNCATE TABLE {}".format(table_name))
                logger.info(f"index_aggregate_views.py | Updating {table_name}")
                upsert = sa.text(query)
                session.execute(upsert,
                    {"most_recent_indexed_aggregate_block":most_recent_indexed_aggregate_block,
                    "latest_indexed_block_num": latest_indexed_block_num}
                )

                logger.info(f"""index_aggregate_views.py | Finished updating
                    {table_name} in: {time.time()-start_time} sec""")

            redis.set(most_recent_indexed_aggregate_block_key, latest_indexed_block_num)

        else:
            logger.info(
                f"index_aggregate_views.py | Failed to acquire lock refresh_aggregate_table:{table_name}"
            )
    except Exception as e:
        logger.error(
            "index_aggregate_views.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()


######## CELERY TASKS ########
@celery.task(name="update_aggregate_user", bind=True)
def update_aggregate_user(self):
    db = update_aggregate_user.db
    redis = update_aggregate_user.redis
    query = """
        INSERT INTO aggregate_user_table
        (
            user_id,
            track_count,
            playlist_count,
            album_count,
            follower_count,
            following_count,
            repost_count,
            track_save_count
        )
        (
            SELECT
                DISTINCT(u.user_id),
                COALESCE (user_track.track_count, 0)       AS track_count,
                COALESCE (user_playlist.playlist_count, 0) AS playlist_count,
                COALESCE (user_album.album_count, 0)       AS album_count,
                COALESCE (user_follower.follower_count, 0) AS follower_count,
                COALESCE (user_followee.followee_count, 0) AS following_count,
                COALESCE (user_repost.repost_count, 0)     AS repost_count,
                COALESCE (user_track_save.save_count, 0)   AS track_save_count
            FROM users u -- join on subquery for tracks created
            LEFT OUTER JOIN (
                SELECT
                    t.owner_id AS owner_id,
                    count(t.owner_id) AS track_count
                FROM tracks t
                WHERE t.is_current IS TRUE
                AND t.is_delete IS FALSE
                AND t.is_unlisted IS FALSE
                AND t.stem_of IS NULL
                AND t.blocknumber > :most_recent_indexed_aggregate_block
                AND t.blocknumber <= :latest_indexed_block_num
                GROUP BY t.owner_id
                ) AS user_track
            ON user_track.owner_id = u.user_id -- join on subquery for playlists created
            LEFT OUTER JOIN (
                SELECT
                    p.playlist_owner_id AS owner_id,
                    count(p.playlist_owner_id) AS playlist_count
                FROM playlists p
                WHERE p.is_album IS FALSE
                AND p.is_current IS TRUE
                AND p.is_delete IS FALSE
                AND p.is_private IS FALSE
                AND p.blocknumber > :most_recent_indexed_aggregate_block
                AND p.blocknumber <= :latest_indexed_block_num
                GROUP BY p.playlist_owner_id
                ) AS user_playlist
            ON user_playlist.owner_id = u.user_id -- join on subquery for albums created
            LEFT OUTER JOIN (
                SELECT
                    p.playlist_owner_id AS owner_id,
                    count(p.playlist_owner_id) AS album_count
                FROM playlists p
                WHERE p.is_album IS TRUE
                AND p.is_current IS TRUE
                AND p.is_delete IS FALSE
                AND p.is_private IS FALSE
                AND p.blocknumber > :most_recent_indexed_aggregate_block
                AND p.blocknumber <= :latest_indexed_block_num
                GROUP BY p.playlist_owner_id
                ) user_album
            ON user_album.owner_id = u.user_id -- join on subquery for followers
            LEFT OUTER JOIN (
                SELECT
                    f.followee_user_id AS followee_user_id,
                    count(f.followee_user_id) AS follower_count
                FROM follows f
                WHERE f.is_current IS TRUE
                AND f.is_delete IS FALSE
                AND f.blocknumber > :most_recent_indexed_aggregate_block
                AND f.blocknumber <= :latest_indexed_block_num
                GROUP BY f.followee_user_id
                ) user_follower
            ON user_follower.followee_user_id = u.user_id -- join on subquery for followee
            LEFT OUTER JOIN (
                SELECT
                    f.follower_user_id        AS follower_user_id,
                    count(f.follower_user_id) AS followee_count
                FROM follows f
                WHERE f.is_current IS TRUE
                AND f.is_delete IS FALSE
                AND f.blocknumber > :most_recent_indexed_aggregate_block
                AND f.blocknumber <= :latest_indexed_block_num
                GROUP BY f.follower_user_id
                ) user_followee
            ON user_followee.follower_user_id = u.user_id -- join on subquery for reposts
            LEFT OUTER JOIN (
                SELECT
                    r.user_id AS user_id,
                    count(r.user_id) AS repost_count
                FROM reposts r
                WHERE r.is_current IS TRUE
                AND r.is_delete IS FALSE
                AND r.blocknumber > :most_recent_indexed_aggregate_block
                AND r.blocknumber <= :latest_indexed_block_num
                GROUP BY r.user_id
                ) user_repost
            ON user_repost.user_id = u.user_id -- join on subquery for track saves
            LEFT OUTER JOIN (
                SELECT
                    s.user_id AS user_id,
                    count(s.user_id) AS save_count
                FROM saves s
                WHERE s.is_current IS TRUE
                AND s.save_type = 'track'
                AND s.is_delete IS FALSE
                AND s.blocknumber > :most_recent_indexed_aggregate_block
                AND s.blocknumber <= :latest_indexed_block_num
                GROUP BY s.user_id
                ) user_track_save
            ON user_track_save.user_id = u.user_id
            WHERE u.is_current IS TRUE
            AND u.blocknumber > :most_recent_indexed_aggregate_block
            AND u.blocknumber <= :latest_indexed_block_num
        )
        ON CONFLICT (user_id)
        DO UPDATE SET
            track_count = aggregate_user_table.track_count + EXCLUDED.track_count,
            playlist_count = aggregate_user_table.playlist_count+EXCLUDED.playlist_count,
            album_count = aggregate_user_table.album_count+EXCLUDED.album_count,
            follower_count =  aggregate_user_table.follower_count+EXCLUDED.follower_count,
            following_count = aggregate_user_table.following_count+EXCLUDED.following_count,
            repost_count =  aggregate_user_table.repost_count+EXCLUDED.repost_count,
            track_save_count = aggregate_user_table.track_save_count+EXCLUDED.track_save_count"""
    update_aggregate_table(db, redis, AGGREGATE_USER, most_recent_indexed_aggregate_user_block_redis_key, query)


@celery.task(name="update_aggregate_track", bind=True)
def update_aggregate_track(self):
    db = update_aggregate_track.db
    redis = update_aggregate_track.redis
    update_materialized_view(db, redis, AGGREGATE_TRACK)


@celery.task(name="update_aggregate_playlist", bind=True)
def update_aggregate_playlist(self):
    db = update_aggregate_playlist.db
    redis = update_aggregate_playlist.redis
    update_materialized_view(db, redis, AGGREGATE_PLAYLIST)
