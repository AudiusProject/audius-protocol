import logging
import sqlalchemy

from src import exceptions
from src.utils import db_session, redis_connection

logger = logging.getLogger(__name__)
redis = redis_connection.get_redis()

def get_cid_source(cid):
    """
    Returns the CID source (e.g. CID is a metadata hash, a cover photo, a track segment, etc.)

    Args: the observed CID
    """
    if cid is None:
        raise exceptions.ArgumentError("Input CID is invalid")

    have_lock = False
    update_lock = redis.lock("get_cid_source_lock", blocking_timeout=25)

    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        response = []
        if have_lock:
            db = db_session.get_db_read_replica()
            with db.scoped_session() as session:
                # Check to see if CID is of any type but a segment
                cid_source_res = sqlalchemy.text(
                    """
                    WITH cid_const AS (VALUES (:cid))
                    SELECT * FROM
                    (
                        (
                            SELECT
                                "user_id" as "id",
                                'users' as "table_name",
                                'metadata_multihash' as "type",
                                "is_current"
                            FROM "users" WHERE (table cid_const) = "metadata_multihash"
                        )
                        UNION ALL
                        (
                            SELECT
                                "user_id" as "id",
                                'users' as "table_name",
                                'profile_cover_images' as "type",
                                "is_current"
                            FROM
                                "users"
                            WHERE
                                (table cid_const) in (
                                    "profile_picture",
                                    "cover_photo",
                                    "profile_picture_sizes",
                                    "cover_photo_sizes"
                                )
                        )
                        UNION ALL
                        (
                                SELECT
                                "playlist_id" as "id",
                                'playlists' as "table_name",
                                'playlist_image_multihash' as "type",
                                "is_current"
                                FROM
                                    "playlists"
                                WHERE
                                    (table cid_const) in (
                                        "playlist_image_sizes_multihash",
                                        "playlist_image_multihash"
                                    )
                        )
                        UNION ALL
                        (
                            SELECT
                                "track_id" as "id",
                                'tracks' as "table_name",
                                'track_metadata' as "type",
                                "is_current"
                            FROM
                                "tracks"
                            WHERE
                                (table cid_const) = "metadata_multihash"
                        )
                        UNION ALL
                        (
                            SELECT
                                "track_id" as "id",
                                'tracks' as "table_name",
                                'cover_art_size' as "type",
                                "is_current"
                            FROM
                                "tracks"
                            WHERE
                                (table cid_const) = "cover_art_sizes"
                        )
                    ) as "outer"
                    """
                )
                cid_source = session.execute(
                    cid_source_res, {"cid": cid}
                ).fetchall()

                # If something is found, set response
                if len(cid_source) != 0:
                    response = [dict(row) for row in cid_source]

                # If CID was not found, check to see if it is a type segment
                if len(response) == 0:
                    cid_source_res = sqlalchemy.text(
                        """
                        WITH cid_const AS (VALUES (:cid))
                            SELECT
                                "track_id" as "id",
                                'tracks' as "table_name",
                                'segment' as "type",
                                "is_current"
                            FROM
                                (
                                    SELECT
                                        jb -> 'duration' as "d",
                                        jb -> 'multihash' :: varchar as "cid",
                                        "track_id",
                                        "is_current"
                                    FROM
                                        (
                                            SELECT
                                                jsonb_array_elements("track_segments") as "jb",
                                                "track_id",
                                                "is_current"
                                            FROM
                                                "tracks"
                                        ) as a
                                ) as a2
                            WHERE
                                "cid" ? (table cid_const)
                        """
                    )

                    cid_source = session.execute(cid_source_res, {"cid": cid}).fetchall()

                    # If something is found, set response
                    if len(cid_source) != 0:
                        response = [dict(row) for row in cid_source]
        else:
            logger.warning("get_cid_source | Failed to acquire get_cid_source_lock")

        return response
    except Exception as e:
        logger.error("get_cid_source | Error with query: %s", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()

