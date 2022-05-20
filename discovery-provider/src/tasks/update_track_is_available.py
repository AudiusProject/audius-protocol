import logging

import requests

# from src.tasks.aggregates import init_task_and_acquire_lock
from src.models import Track, User
from src.tasks.celery_app import celery
from src.utils.eth_contracts_helpers import fetch_all_registered_content_node_info

logger = logging.getLogger(__name__)


ALL_UNAVAILABLE_TRACKS_REDIS_KEY = "unavailable_tracks_all"
BATCH_SIZE = 1000


def update_track_is_available_in_db(db, tracks_with_updated_is_available_status):
    query_results = None
    with db.scoped_session() as session:
        query_results = session.bulk_update_mappings(
            Track, tracks_with_updated_is_available_status
        )

    return query_results


def fetch_unavailable_track_ids(node):
    resp = requests.get(f"{node}/blacklist/tracks").json()
    unavailable_track_ids = resp["data"]["values"]
    return unavailable_track_ids


def query_replica_set_by_track_id(db, track_ids):
    query_results = None
    with db.scoped_session() as session:
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


# ####### CELERY TASKS ####### #
@celery.task(name="update_track_is_available", bind=True)
def update_track_is_available(self):
    db = update_track_is_available.db
    redis = update_track_is_available.redis

    spID_to_endpoint = {}
    content_nodes = fetch_all_registered_content_node_info()
    for node in content_nodes:
        # Keep mapping of spID to url endpoint
        spID_to_endpoint[node.spID] = node.endpoint

        # Keep mapping of spId to set of unavailable tracks
        unavailable_track_ids = fetch_unavailable_track_ids(node.endpoint)
        spID_unavailable_tracks_key = get_unavailable_tracks_redis_key(node.spID)
        redis.sadd(spID_unavailable_tracks_key, unavailable_track_ids)

        # Aggregate a set of unavailable tracks
        redis.sadd(ALL_UNAVAILABLE_TRACKS_REDIS_KEY, unavailable_track_ids)

    # Check track availability on all unavailable tracks and update in Tracks table
    all_unavailable_track_ids = redis.smembers(ALL_UNAVAILABLE_TRACKS_REDIS_KEY)
    for i in range(0, len(all_unavailable_track_ids), BATCH_SIZE):
        unavailable_track_ids_batch = all_unavailable_track_ids[i : i + BATCH_SIZE]

        tracks_to_update = []
        track_ids_to_replica_set = query_replica_set_by_track_id(
            db, unavailable_track_ids_batch
        )

        for entry in track_ids_to_replica_set:
            track_id = entry[0]
            spID_replica_set = [entry[1], *entry[2]]
            is_available = check_track_is_available(
                redis=redis, track_id=track_id, spID_replica_set=spID_replica_set
            )
            tracks_to_update.append(
                {"track_id": track_id, "is_available": is_available}
            )

        update_track_is_available_in_db(db, tracks_to_update)

        # pass
        # try:
        #     init_task_and_acquire_lock(
        #         logger, db, redis, AGGREGATE_PLAYS_TABLE_NAME, _update_track_is_available
        #     # except Exception as e:
