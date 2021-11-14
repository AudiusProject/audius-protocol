import logging
import time
import sqlalchemy as sa
from src.tasks.celery_app import celery
from src.utils.redis_constants import most_recent_indexed_aggregate_user_block_redis_key
from src.tasks.calculate_trending_challenges import get_latest_blocknumber

logger = logging.getLogger(__name__)

# Names of the aggregate tables to update
AGGREGATE_USER_TABLE_NAME = "aggregate_user"
AGGREGATE_USER_TEMP_TABLE_NAME = "aggregate_user_temp"

DEFAULT_UPDATE_TIMEOUT = 60 * 30  # 30 minutes

# every ~1000 updates, refresh the entire table
# at 30 secs interval, this should happen ~twice a day
REFRESH_COUNTER = 1000

### UPDATE_AGGREGATE_USER_QUERY ###
# Get a lower bound blocknumber to check for new entity counts for a user
# Find a subset of users that have changed since that blocknumber
# For that subset of users reclaculate the entire counts for each entity
# Insert that count for new users or update it to an existing row
UPDATE_AGGREGATE_USER_QUERY = f"""
        WITH aggregate_user_latest_blocknumber AS (
            SELECT
                :most_recent_indexed_aggregate_block AS blocknumber
        ),
        changed_users AS (
            SELECT
                user_id
            FROM
                users u
            WHERE
                u.is_current IS TRUE
                AND u.blocknumber > (
                    SELECT
                        blocknumber
                    FROM
                        aggregate_user_latest_blocknumber
                )
            GROUP BY
                user_id
            UNION
            ALL
            SELECT
                t.owner_id AS owner_id
            FROM
                tracks t
            WHERE
                t.is_current IS TRUE
                AND t.blocknumber > (
                    SELECT
                        blocknumber
                    FROM
                        aggregate_user_latest_blocknumber
                )
            GROUP BY
                t.owner_id
            UNION
            ALL
            SELECT
                p.playlist_owner_id AS owner_id
            FROM
                playlists p
            WHERE
                p.is_album IS FALSE
                AND p.is_current IS TRUE
                AND p.blocknumber > (
                    SELECT
                        blocknumber
                    FROM
                        aggregate_user_latest_blocknumber
                )
            GROUP BY
                p.playlist_owner_id
            UNION
            ALL
            SELECT
                p.playlist_owner_id AS owner_id
            FROM
                playlists p
            WHERE
                p.is_album IS TRUE
                AND p.is_current IS TRUE
                AND p.blocknumber > (
                    SELECT
                        blocknumber
                    FROM
                        aggregate_user_latest_blocknumber
                )
            GROUP BY
                p.playlist_owner_id
            UNION
            ALL (
                SELECT
                    f.followee_user_id AS followee_user_id
                FROM
                    follows f
                WHERE
                    f.is_current IS TRUE
                    AND f.blocknumber > (
                        SELECT
                            blocknumber
                        FROM
                            aggregate_user_latest_blocknumber
                    )
                GROUP BY
                    f.followee_user_id
            )
            UNION
            ALL (
                SELECT
                    f.follower_user_id AS follower_user_id
                FROM
                    follows f
                WHERE
                    f.is_current IS TRUE
                    AND f.blocknumber > (
                        SELECT
                            blocknumber
                        from
                            aggregate_user_latest_blocknumber
                    )
                GROUP BY
                    f.follower_user_id
            )
            UNION
            ALL (
                SELECT
                    r.user_id AS user_id
                FROM
                    reposts r
                WHERE
                    r.is_current IS TRUE
                    AND r.blocknumber > (
                        SELECT
                            blocknumber
                        from
                            aggregate_user_latest_blocknumber
                    )
                GROUP BY
                    r.user_id
            )
            UNION
            ALL (
                SELECT
                    s.user_id AS user_id
                FROM
                    saves s
                WHERE
                    s.is_current IS TRUE
                    AND s.save_type = 'track'
                    AND s.blocknumber > (
                        SELECT
                            blocknumber
                        FROM
                            aggregate_user_latest_blocknumber
                    )
                GROUP BY
                    s.user_id
            )
        )
        INSERT INTO
            {} (
                user_id,
                track_count,
                playlist_count,
                album_count,
                follower_count,
                following_count,
                repost_count,
                track_save_count
            )
        SELECT
            DISTINCT(u.user_id),
            COALESCE (user_track.track_count, 0) AS track_count,
            COALESCE (user_playlist.playlist_count, 0) AS playlist_count,
            COALESCE (user_album.album_count, 0) AS album_count,
            COALESCE (user_follower.follower_count, 0) AS follower_count,
            COALESCE (user_followee.followee_count, 0) AS following_count,
            COALESCE (user_repost.repost_count, 0) AS repost_count,
            COALESCE (user_track_save.save_count, 0) AS track_save_count
        FROM
            users u
            LEFT OUTER JOIN (
                SELECT
                    t.owner_id AS owner_id,
                    count(t.owner_id) AS track_count
                FROM
                    tracks t
                WHERE
                    t.is_current IS TRUE
                    AND t.is_delete IS FALSE
                    AND t.is_unlisted IS FALSE
                    AND t.stem_of IS NULL
                    AND t.owner_id IN (
                        select
                            user_id
                        from
                            changed_users
                    )
                GROUP BY
                    t.owner_id
            ) as user_track ON user_track.owner_id = u.user_id
            LEFT OUTER JOIN (
                SELECT
                    p.playlist_owner_id AS owner_id,
                    count(p.playlist_owner_id) AS playlist_count
                FROM
                    playlists p
                WHERE
                    p.is_album IS FALSE
                    AND p.is_current IS TRUE
                    AND p.is_delete IS FALSE
                    AND p.is_private IS FALSE
                    AND p.playlist_owner_id IN (
                        select
                            user_id
                        from
                            changed_users
                    )
                GROUP BY
                    p.playlist_owner_id
            ) AS user_playlist ON user_playlist.owner_id = u.user_id
            LEFT OUTER JOIN (
                SELECT
                    p.playlist_owner_id AS owner_id,
                    count(p.playlist_owner_id) AS album_count
                FROM
                    playlists p
                WHERE
                    p.is_album IS TRUE
                    AND p.is_current IS TRUE
                    AND p.is_delete IS FALSE
                    AND p.is_private IS FALSE
                    AND p.playlist_owner_id IN (
                        SELECT
                            user_id
                        FROM
                            changed_users
                    )
                GROUP BY
                    p.playlist_owner_id
            ) user_album ON user_album.owner_id = u.user_id
            LEFT OUTER JOIN (
                SELECT
                    f.followee_user_id AS followee_user_id,
                    count(f.followee_user_id) AS follower_count
                FROM
                    follows f
                WHERE
                    f.is_current IS TRUE
                    AND f.is_delete IS FALSE
                    AND f.followee_user_id IN ( -- to calculate follower count for changed users, changed user id must match followee user id
                        SELECT
                            user_id
                        FROM
                            changed_users
                    )
                GROUP BY
                    f.followee_user_id
            ) user_follower ON user_follower.followee_user_id = u.user_id
            LEFT OUTER JOIN (
                SELECT
                    f.follower_user_id AS follower_user_id,
                    count(f.follower_user_id) AS followee_count
                FROM
                    follows f
                WHERE
                    f.is_current IS TRUE
                    AND f.is_delete IS FALSE
                    AND f.follower_user_id IN (
                        SELECT
                            user_id
                        FROM
                            changed_users
                    )
                GROUP BY
                    f.follower_user_id
            ) user_followee ON user_followee.follower_user_id = u.user_id
            LEFT OUTER JOIN (
                SELECT
                    r.user_id AS user_id,
                    count(r.user_id) AS repost_count
                FROM
                    reposts r
                WHERE
                    r.is_current IS TRUE
                    AND r.is_delete IS FALSE
                    AND r.user_id IN (
                        SELECT
                            user_id
                        from
                            changed_users
                    )
                GROUP BY
                    r.user_id
            ) user_repost ON user_repost.user_id = u.user_id
            LEFT OUTER JOIN (
                SELECT
                    s.user_id AS user_id,
                    count(s.user_id) AS save_count
                FROM
                    saves s
                WHERE
                    s.is_current IS TRUE
                    AND s.save_type = 'track'
                    AND s.is_delete IS FALSE
                    AND s.user_id IN (
                        select
                            user_id
                        from
                            changed_users
                    )
                GROUP BY
                    s.user_id
            ) user_track_save ON user_track_save.user_id = u.user_id
        WHERE
            u.is_current IS TRUE
            AND u.user_id in (
                SELECT
                    user_id
                FROM
                    changed_users
            ) ON CONFLICT (user_id) DO
        UPDATE
        SET
            track_count = EXCLUDED.track_count,
            playlist_count = EXCLUDED.playlist_count,
            album_count = EXCLUDED.album_count,
            follower_count = EXCLUDED.follower_count,
            following_count = EXCLUDED.following_count,
            repost_count = EXCLUDED.repost_count,
            track_save_count = EXCLUDED.track_save_count
    """

### UPDATE_AGGREGATE_USER_QUERY ###
# Recreating these dependent mat views
# trending_params from revision 92571f94989a
# user_lexeme_dict from revision af43df9fbde0
RECREATE_DEPENDENCIES_QUERY = """
    CREATE MATERIALIZED VIEW trending_params as
    SELECT
        t.track_id as track_id,
        t.genre as genre,
        t.owner_id as owner_id,
        ap.play_count as play_count,
        au.follower_count as owner_follower_count,
        COALESCE (aggregate_track.repost_count, 0) as repost_count,
        COALESCE (aggregate_track.save_count, 0) as save_count,
        COALESCE (repost_week.repost_count, 0) as repost_week_count,
        COALESCE (repost_month.repost_count, 0) as repost_month_count,
        COALESCE (repost_year.repost_count, 0) as repost_year_count,
        COALESCE (save_week.repost_count, 0) as save_week_count,
        COALESCE (save_month.repost_count, 0) as save_month_count,
        COALESCE (save_year.repost_count, 0) as save_year_count,
        COALESCE (karma.karma, 0) as karma
    FROM
        tracks t
    -- join on subquery for aggregate play count
    LEFT OUTER JOIN (
        SELECT
            ap.count as play_count,
            ap.play_item_id as play_item_id
        FROM
            aggregate_plays ap
    ) as ap ON ap.play_item_id = t.track_id
    -- join on subquery for aggregate user
    LEFT OUTER JOIN (
        SELECT
            au.user_id as user_id,
            au.follower_count as follower_count
        FROM
            aggregate_user au
    ) as au ON au.user_id = t.owner_id
    -- join on subquery for aggregate track
    LEFT OUTER JOIN (
        SELECT
            aggregate_track.track_id as track_id,
            aggregate_track.repost_count as repost_count,
            aggregate_track.save_count as save_count
        FROM
            aggregate_track
    ) as aggregate_track ON aggregate_track.track_id = t.track_id
    -- -- join on subquery for reposts by year
    LEFT OUTER JOIN (
        SELECT
            r.repost_item_id as track_id,
            count(r.repost_item_id) as repost_count
        FROM
            reposts r
        WHERE
            r.is_current is True AND
            r.repost_type = 'track' AND
            r.is_delete is False AND
            r.created_at > (now() - interval '1 year')
        GROUP BY r.repost_item_id
    ) repost_year ON repost_year.track_id = t.track_id
    -- -- join on subquery for reposts by month
    LEFT OUTER JOIN (
        SELECT
            r.repost_item_id as track_id,
            count(r.repost_item_id) as repost_count
        FROM
            reposts r
        WHERE
            r.is_current is True AND
            r.repost_type = 'track' AND
            r.is_delete is False AND
            r.created_at > (now() - interval '1 month')
        GROUP BY r.repost_item_id
    ) repost_month ON repost_month.track_id = t.track_id
    -- -- join on subquery for reposts by week
    LEFT OUTER JOIN (
        SELECT
            r.repost_item_id as track_id,
            count(r.repost_item_id) as repost_count
        FROM
            reposts r
        WHERE
            r.is_current is True AND
            r.repost_type = 'track' AND
            r.is_delete is False AND
            r.created_at > (now() - interval '1 week')
        GROUP BY r.repost_item_id
    ) repost_week ON repost_week.track_id = t.track_id
    -- -- join on subquery for saves by year
    LEFT OUTER JOIN (
        SELECT
            r.save_item_id as track_id,
            count(r.save_item_id) as repost_count
        FROM
            saves r
        WHERE
            r.is_current is True AND
            r.save_type = 'track' AND
            r.is_delete is False AND
            r.created_at > (now() - interval '1 year')
        GROUP BY r.save_item_id
    ) save_year ON save_year.track_id = t.track_id
    -- -- join on subquery for saves by month
    LEFT OUTER JOIN (
        SELECT
            r.save_item_id as track_id,
            count(r.save_item_id) as repost_count
        FROM
            saves r
        WHERE
            r.is_current is True AND
            r.save_type = 'track' AND
            r.is_delete is False AND
            r.created_at > (now() - interval '1 month')
        GROUP BY r.save_item_id
    ) save_month ON save_month.track_id = t.track_id
    -- -- join on subquery for saves by week
    LEFT OUTER JOIN (
        SELECT
            r.save_item_id as track_id,
            count(r.save_item_id) as repost_count
        FROM
            saves r
        WHERE
            r.is_current is True AND
            r.save_type = 'track' AND
            r.is_delete is False AND
            r.created_at > (now() - interval '1 week')
        GROUP BY r.save_item_id
    ) save_week ON save_week.track_id = t.track_id
    LEFT OUTER JOIN (
        SELECT
            save_and_reposts.item_id as track_id,
            sum(au.follower_count) as karma
        FROM
            (
                select
                    r_and_s.user_id,
                    r_and_s.item_id
                from
                    (select
                        user_id,
                        repost_item_id as item_id
                    from
                        reposts
                    where
                        is_delete is false AND
                        is_current is true AND
                        repost_type = 'track'
                    union all
                    select
                        user_id,
                        save_item_id as item_id
                    from
                        saves
                    where
                        is_delete is false AND
                        is_current is true AND
                        save_type = 'track'
                    ) r_and_s
                join
                    users
                on r_and_s.user_id = users.user_id
                where
                    users.cover_photo is not null AND
                    users.profile_picture is not null AND
                    users.bio is not null
            ) save_and_reposts
        JOIN
            aggregate_user au
        ON
            save_and_reposts.user_id = au.user_id
        GROUP BY save_and_reposts.item_id
    ) karma ON karma.track_id = t.track_id
    WHERE
        t.is_current is True AND
        t.is_delete is False AND
        t.is_unlisted is False AND
        t.stem_of is Null;

    CREATE INDEX trending_params_track_id_idx ON trending_params (track_id);


    -- user_lexeme_dict from af43df9fbde0

    DROP INDEX IF EXISTS user_words_idx;

    CREATE MATERIALIZED VIEW user_lexeme_dict as
    SELECT row_number() OVER (PARTITION BY true), * FROM (
        SELECT
            u.user_id,
            lower(u.name) as user_name,
            lower(u.handle) as handle,
            a.follower_count as follower_count,
            unnest(
                tsvector_to_array(
                    to_tsvector(
                        'audius_ts_config',
                        replace(COALESCE(u.name, ''), '&', 'and')
                    ) ||
                    to_tsvector(
                        'audius_ts_config',
                        COALESCE(u.handle, '')
                    )
                ) || lower(COALESCE(u.name, ''))
            ) as word
        FROM
            users u
        INNER JOIN aggregate_user a on a.user_id = u.user_id
        WHERE u.is_current = true and
        u.user_id not in (
            select u.user_id from users u
            inner join
                (
                    select distinct lower(u1.handle) as handle, u1.user_id from users u1
                    where u1.is_current = true and u1.is_verified = true
                ) as sq
            on lower(u.name) = sq.handle and u.user_id != sq.user_id
            where u.is_current = true
        )
        GROUP BY u.user_id, u.name, u.handle, a.follower_count
    ) AS words;

    CREATE INDEX user_words_idx ON user_lexeme_dict USING gin(word gin_trgm_ops);
    CREATE INDEX user_handles_idx ON user_lexeme_dict(handle);
    CREATE UNIQUE INDEX user_row_number_idx ON user_lexeme_dict(row_number);"""

def update(redis, session, target_table, most_recent_indexed_aggregate_block, latest_indexed_block_num):
    logger.info(f"index_aggregate_user.py | Updating {AGGREGATE_USER_TABLE_NAME}")
    upsert = sa.text(UPDATE_AGGREGATE_USER_QUERY.format(target_table))
    session.execute(
        upsert,
        {
            "most_recent_indexed_aggregate_block": most_recent_indexed_aggregate_block,
        },
    )

    # set new block to be the lower bound for the next indexing
    redis.set(
        most_recent_indexed_aggregate_user_block_redis_key, latest_indexed_block_num
    )

def update_aggregate_table(
    db,
    redis,
    timeout=DEFAULT_UPDATE_TIMEOUT,
):
    have_lock = False
    update_lock = redis.lock(f"update_aggregate_table:{AGGREGATE_USER_TABLE_NAME}", timeout=timeout)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            start_time = time.time()

            most_recent_indexed_aggregate_block = redis.get(
                most_recent_indexed_aggregate_user_block_redis_key
            )
            if most_recent_indexed_aggregate_block:
                most_recent_indexed_aggregate_block = int(
                    most_recent_indexed_aggregate_block
                )
                logger.info(
                    f"""index_aggregate_user.py | most_recent_indexed_aggregate_block:
                    {most_recent_indexed_aggregate_block}"""
                )

            latest_indexed_block_num = 0
            with db.scoped_session() as session:
                latest_indexed_block_num = get_latest_blocknumber(session, redis)


            if (
                not most_recent_indexed_aggregate_block
                or latest_indexed_block_num % REFRESH_COUNTER == 0
            ):
                # re-create entire table
                # recreate and drop so dependent queries aren't blocked, waiting for update
                with db.scoped_session() as session:
                    most_recent_indexed_aggregate_block = 0

                    # must drop dependent mat views before dropping aggregate_user
                    session.execute("DROP MATERIALIZED VIEW IF EXISTS user_lexeme_dict")
                    session.execute("DROP MATERIALIZED VIEW IF EXISTS trending_params")

                    session.execute("CREATE TABLE IF NOT EXISTS {} (LIKE {} INCLUDING ALL)"
                        .format(AGGREGATE_USER_TEMP_TABLE_NAME, AGGREGATE_USER_TABLE_NAME))

                    update(redis, session, AGGREGATE_USER_TEMP_TABLE_NAME,
                        most_recent_indexed_aggregate_block, latest_indexed_block_num)

                    session.execute("DROP TABLE IF EXISTS {}".format(AGGREGATE_USER_TABLE_NAME))
                    session.execute("ALTER TABLE {} RENAME TO {}"
                        .format(AGGREGATE_USER_TEMP_TABLE_NAME, AGGREGATE_USER_TABLE_NAME))

                    session.execute(RECREATE_DEPENDENCIES_QUERY)

            else:
                with db.scoped_session() as session:
                    # upsert to existing table
                    update(redis, session, AGGREGATE_USER_TABLE_NAME,
                        most_recent_indexed_aggregate_block, latest_indexed_block_num)

            logger.info(
                f"""index_aggregate_user.py | Finished updating
                {AGGREGATE_USER_TABLE_NAME} in: {time.time()-start_time} sec"""
            )

        else:
            logger.info(
                f"index_aggregate_user.py | Failed to acquire lock update_aggregate_table:{AGGREGATE_USER_TABLE_NAME}"
            )
    except Exception as e:
        logger.error(
            "index_aggregate_user.py | Fatal error in main loop", exc_info=True
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
    update_aggregate_table(
        db,
        redis
    )
