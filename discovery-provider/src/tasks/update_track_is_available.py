import logging

import requests
from src.models import Track, User
from src.tasks.celery_app import celery
from src.utils.eth_contracts_helpers import fetch_all_registered_content_node_info

# from typing import Any


logger = logging.getLogger(__name__)


ALL_UNAVAILABLE_TRACKS_REDIS_KEY = "unavailable_tracks_all"
BATCH_SIZE = 1000
DEFAULT_LOCK_TIMEOUT_SECONDS = 86400  # 24 hour -- the max duration of 1 worker
REQUESTS_TIMEOUT_SECONDS = 300  # 5 minutes


def _get_redis_set_members_as_list(redis, key):
    values = redis.smembers(key)
    return [int(value.decode()) for value in values]


def fetch_unavailable_track_ids_in_network(redis):
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


def update_tracks_is_available_status(db, redis):
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
                for entry in track_ids_to_replica_set:
                    track_id = entry[0]
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
                    f"Could not process batch {unavailable_track_ids_batch}: {e}\nContinuing..."
                )
                session.rollback()


def fetch_unavailable_track_ids(node):
    """Fetches unavailable tracks from Content Node. Returns empty list if request fails."""
    unavailable_track_ids = []

    try:
        resp = requests.get(
            f"{node}/blacklist/tracks", timeout=REQUESTS_TIMEOUT_SECONDS
        ).json()
        unavailable_track_ids = resp["data"]["values"]
    except Exception as e:
        logger.warn(f"Could not fetch unavailable tracks from {node}: {e}")

    return unavailable_track_ids


def query_replica_set_by_track_id(session, track_ids):
    """
    Returns an array of tuples with the structure:
    (integer: track_id | integer: primary_id | integer[]: secondary_ids)
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


def query_tracks_by_track_ids(session, track_ids):
    tracks = (
        session.query(Track)
        .filter(
            Track.is_current == True,
            Track.track_id.in_(track_ids),
        )
        .all()
    )

    return tracks


def check_track_is_available(redis, track_id, spID_replica_set):
    """
    Checks if a track is available in the replica set. Needs to only be available
    on one replica set node to be marked as available.
        redis: redis instance
        track_id: integer; the observed track id
        spID_replica_set: integer[] an array of the SP IDs that are associated with track
    """

    is_available_in_network = False
    i = 0
    while not is_available_in_network and i < len(spID_replica_set):
        spID_unavailable_tracks_key = get_unavailable_tracks_redis_key(
            spID_replica_set[i]
        )
        is_available_on_sp = not redis.sismember(spID_unavailable_tracks_key, track_id)

        if is_available_on_sp:
            is_available_in_network = True

        i = i + 1

    return is_available_in_network


def get_unavailable_tracks_redis_key(spID):
    """Returns the key used to store the unavailable tracks on a sp"""
    return f"unavailable_tracks_{spID}"


# TODO: what happens when a worker fails? wrap in try/catch? not necessary?
# TODO: what happens when fetching unavail tracks fails?

# TODO: actual todo :3
# o add migration for "is_available" column in "Tracks". default to "True"
# o unit test the updating the tracks table with the 'is_available' status
# o unit test fetch_unavailable_track_ids_in_network
# o unit test update_tracks_is_available_status
# - consider and handle fail conditions
# - consider and handle batching
# - consider file placement?
# - unit/manual test update_track_is_available / get the worker working

# ####### CELERY TASKS ####### #
@celery.task(name="update_track_is_available", bind=True)
def update_track_is_available(self):
    """
    Recurring task that updates whether tracks are available on the network
    """

    # Reference: src/tasks/user_listening_history/index_user_listening_history.py

    db = update_track_is_available.db
    redis = update_track_is_available.redis

    have_lock = False
    update_lock = redis.lock(
        "disc_prov_lock",
        timeout=DEFAULT_LOCK_TIMEOUT_SECONDS,
    )

    try:
        have_lock = update_lock.acquire(blocking=False)
        # TODO: clear redis here ? how often do tracks get un-delisted?
        if have_lock:
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
            update_lock.release()
