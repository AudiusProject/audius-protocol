import logging
from datetime import datetime
from typing import Any, List, Tuple, Union

import requests
from src.models import Track, User
from src.tasks.celery_app import celery
from src.utils.eth_contracts_helpers import fetch_all_registered_content_node_info

logger = logging.getLogger(__name__)

UPDATE_TRACK_IS_AVAILABLE_LOCK = "update_track_is_available_lock"
ALL_UNAVAILABLE_TRACKS_REDIS_KEY = "update_track_is_available:unavailable_tracks_all"
BATCH_SIZE = 1000
DEFAULT_LOCK_TIMEOUT_SECONDS = 86400  # 24 hour -- the max duration of 1 worker
REQUESTS_TIMEOUT_SECONDS = 300  # 5 minutes


def _get_redis_set_members_as_list(redis: Any, key: str) -> List[int]:
    values = redis.smembers(key)
    return [int(value.decode()) for value in values]


def fetch_unavailable_track_ids_in_network(redis: Any) -> None:
    content_nodes = fetch_all_registered_content_node_info()

    # Clear redis for existing data
    redis.delete(ALL_UNAVAILABLE_TRACKS_REDIS_KEY)

    for node in content_nodes:
        # Keep mapping of spId to set of unavailable tracks
        unavailable_track_ids = fetch_unavailable_track_ids(node["endpoint"])
        spID_unavailable_tracks_key = get_unavailable_tracks_redis_key(node["spID"])

        # Clear redis for existing data
        redis.delete(spID_unavailable_tracks_key)

        for i in range(0, len(unavailable_track_ids), BATCH_SIZE):
            unavailable_track_ids_batch = unavailable_track_ids[i : i + BATCH_SIZE]
            redis.sadd(spID_unavailable_tracks_key, *unavailable_track_ids_batch)

            # Aggregate a set of unavailable tracks
            redis.sadd(ALL_UNAVAILABLE_TRACKS_REDIS_KEY, *unavailable_track_ids_batch)


def update_tracks_is_available_status(db: Any, redis: Any) -> None:
    """Check track availability on all unavailable tracks and update in Tracks table"""
    all_unavailable_track_ids = _get_redis_set_members_as_list(
        redis, ALL_UNAVAILABLE_TRACKS_REDIS_KEY
    )

    for i in range(0, len(all_unavailable_track_ids), BATCH_SIZE):
        unavailable_track_ids_batch = all_unavailable_track_ids[i : i + BATCH_SIZE]
        with db.scoped_session() as session:
            try:

                track_ids_to_replica_set = query_replica_set_by_track_id(
                    session, unavailable_track_ids_batch
                )

                track_id_to_is_available_status = {}
                entry: Tuple[int, Union[int, None], Union[List[int], List[None]]]
                for entry in track_ids_to_replica_set:
                    track_id = entry[0]

                    # Some users are do not have primary_ids or secondary_ids
                    # If these values are null, default to track is available
                    if entry[1] is None or entry[2][0] is None or entry[2][1] is None:
                        is_available = True
                    else:
                        spID_replica_set = [entry[1], *entry[2]]
                        is_available = check_track_is_available(
                            redis=redis,
                            track_id=track_id,
                            spID_replica_set=spID_replica_set,
                        )

                    track_id_to_is_available_status[track_id] = is_available

                # Update tracks with is_available status
                tracks = query_tracks_by_track_ids(session, unavailable_track_ids_batch)
                for track in tracks:
                    is_available = track_id_to_is_available_status[track.track_id]

                    # If track is not available, also flip 'is_delete' flag to True
                    if not is_available:
                        track.is_available = False
                        track.is_delete = True

                session.commit()
            except Exception as e:
                logger.warn(
                    f"update_track_is_available.py | Could not process batch {unavailable_track_ids_batch}: {e}\nContinuing..."
                )
                session.rollback()


def fetch_unavailable_track_ids(node: str) -> List[int]:
    """Fetches unavailable tracks from Content Node. Returns empty list if request fails."""
    unavailable_track_ids = []

    try:
        resp = requests.get(
            f"{node}/blacklist/tracks", timeout=REQUESTS_TIMEOUT_SECONDS
        ).json()
        unavailable_track_ids = resp["data"]["values"]
    except Exception as e:
        logger.warn(
            f"update_track_is_available.py | Could not fetch unavailable tracks from {node}: {e}"
        )

    return unavailable_track_ids


def query_replica_set_by_track_id(
    session: Any, track_ids: List[int]
) -> Union[List[Tuple[int, int, List[int]]], List[Tuple[int, None, List[None]]]]:
    """
    Returns an array of tuples with the structure: [(track_id | primary_id | secondary_ids), ...]
    If `primary_id` and `secondary_ids` are undefined, will return as None
    """
    query_results = (
        session.query(Track.track_id, User.primary_id, User.secondary_ids)
        .join(User, Track.owner_id == User.user_id, isouter=True)  # left join
        .filter(
            User.is_current == True,
            Track.is_current == True,
            Track.track_id.in_(track_ids),
        )
        .all()
    )

    return query_results


def query_tracks_by_track_ids(session: Any, track_ids: List[int]) -> List[Any]:
    """Returns a list of Track objects that has a track id in `track_ids`"""
    tracks = (
        session.query(Track)
        .filter(
            Track.is_current == True,
            Track.track_id.in_(track_ids),
        )
        .all()
    )

    return tracks


def check_track_is_available(
    redis: Any, track_id: int, spID_replica_set: List[int]
) -> bool:
    """
    Checks if a track is available in the replica set. Needs to only be available
    on one replica set node to be marked as available.
        redis: redis instance
        track_id: the observed track id
        spID_replica_set: an array of the SP IDs that are associated with track
    """

    i = 0
    while i < len(spID_replica_set):
        spID_unavailable_tracks_key = get_unavailable_tracks_redis_key(
            spID_replica_set[i]
        )
        is_available_on_sp = not redis.sismember(spID_unavailable_tracks_key, track_id)

        if is_available_on_sp:
            return True

        i = i + 1

    return False


def get_unavailable_tracks_redis_key(spID: int) -> str:
    """Returns the redis key used to store the unavailable tracks on a sp"""
    return f"update_track_is_available:unavailable_tracks_{spID}"


# ####### CELERY TASKS ####### #
@celery.task(name="update_track_is_available", bind=True)
def update_track_is_available(self) -> None:
    """
    Recurring task that updates whether tracks are available on the network
    """

    db = update_track_is_available.db
    redis = update_track_is_available.redis

    have_lock = False
    update_lock = redis.lock(
        UPDATE_TRACK_IS_AVAILABLE_LOCK,
        timeout=DEFAULT_LOCK_TIMEOUT_SECONDS,
    )

    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            redis.set(
                "update_track_is_available:start",
                datetime.now().strftime("%m/%d/%Y, %H:%M:%S.%f"),
            )

            fetch_unavailable_track_ids_in_network(redis)

            update_tracks_is_available_status(db, redis)
        else:
            logger.warning(
                "update_track_is_available.py | Lock not acquired",
                exc_info=True,
            )

    except Exception as e:
        logger.error(
            "update_track_is_available.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            redis.set(
                "update_track_is_available:finish",
                datetime.now().strftime("%m/%d/%Y, %H:%M:%S.%f"),
            )
            update_lock.release()
