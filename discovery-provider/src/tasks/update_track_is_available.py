import logging

import requests

# TODO: do i need this?
# from src.tasks.aggregates import init_task_and_acquire_lock
from src.models import Track, User
from src.tasks.celery_app import celery
from src.tasks.tracks import invalidate_old_tracks
from src.utils.eth_contracts_helpers import fetch_all_registered_content_node_info

logger = logging.getLogger(__name__)


ALL_UNAVAILABLE_TRACKS_REDIS_KEY = "unavailable_tracks_all"
BATCH_SIZE = 1000


def _get_redis_set_members_as_list(redis, key):
    values = redis.smembers(key)
    return [int(value.decode()) for value in values]


def fetch_unavailable_track_ids_in_network(redis):
    content_nodes = fetch_all_registered_content_node_info()
    for node in content_nodes:
        # Keep mapping of spId to set of unavailable tracks
        unavailable_track_ids = fetch_unavailable_track_ids(node["endpoint"])
        spID_unavailable_tracks_key = get_unavailable_tracks_redis_key(node["spID"])

        # TODO: we should probably batch this sadd
        redis.sadd(spID_unavailable_tracks_key, *unavailable_track_ids)

        # Aggregate a set of unavailable tracks
        # TODO: and batch this sadd
        redis.sadd(ALL_UNAVAILABLE_TRACKS_REDIS_KEY, *unavailable_track_ids)


def update_tracks_is_available_status(db, redis):
    """Check track availability on all unavailable tracks and update in Tracks table"""
    all_unavailable_track_ids = _get_redis_set_members_as_list(
        redis, ALL_UNAVAILABLE_TRACKS_REDIS_KEY
    )

    # TODO: wrap in big try/except probably
    for i in range(0, len(all_unavailable_track_ids), BATCH_SIZE):
        with db.scoped_session() as session:
            unavailable_track_ids_batch = all_unavailable_track_ids[i : i + BATCH_SIZE]

            track_ids_to_replica_set = query_replica_set_by_track_id(
                session, unavailable_track_ids_batch
            )

            track_id_to_is_available_status = {}
            for entry in track_ids_to_replica_set:
                track_id = entry[0]
                spID_replica_set = [entry[1], *entry[2]]

                is_available = check_track_is_available(
                    redis=redis, track_id=track_id, spID_replica_set=spID_replica_set
                )
                track_id_to_is_available_status[track_id] = is_available

            # Invalidate old tracks and update with is_available status
            tracks = query_tracks_by_track_ids(session, unavailable_track_ids_batch)
            invalidate_old_tracks(session, unavailable_track_ids_batch)

            def update_is_available(track):
                track.is_available = track_id_to_is_available_status[track_id]
                return track

            tracks_with_updated_is_available_status = list(
                map(update_is_available, tracks)
            )
            session.bulk_save_objects(tracks_with_updated_is_available_status)
            session.commit()


def fetch_unavailable_track_ids(node):
    resp = requests.get(f"{node}/blacklist/tracks").json()
    unavailable_track_ids = resp["data"]["values"]
    return unavailable_track_ids


def query_replica_set_by_track_id(session, track_ids):
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
    query_results = (
        session.query(Track)
        .filter(
            Track.is_current == True,
            Track.track_id.in_(track_ids),
        )
        .all()
    )

    return query_results


def check_track_is_available(redis, track_id, spID_replica_set):
    """
    Checks if a track is available in the replica set. Needs to only be available
    on one replica set node to be marked as available.
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
    db = update_track_is_available.db
    redis = update_track_is_available.redis

    fetch_unavailable_track_ids_in_network(redis)
    update_tracks_is_available_status(db, redis)
