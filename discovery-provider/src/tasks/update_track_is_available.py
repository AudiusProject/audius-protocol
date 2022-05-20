import logging

import requests

# from src.tasks.aggregates import init_task_and_acquire_lock
from src.models import Track, User
from src.tasks.celery_app import celery
from src.utils.eth_contracts_helpers import fetch_all_registered_content_node_info

logger = logging.getLogger(__name__)


ALL_UNAVAILABLE_TRACKS_REDIS_KEY = "unavailable_tracks_all"


def _update_track_is_available():
    pass


def fetch_unavailable_track_ids(node):
    resp = requests.get(f"{node}/blacklist/tracks").json()
    unavailable_track_ids = resp["data"]["values"]
    return unavailable_track_ids


def query_replica_set_by_track_id(db, track_ids):
    query_results = None
    with db.scoped_session() as session:
        query_results = session.query(
            Track.track_id, User.user_id, User.primary_id, User.secondary_ids
        ).join(
            User,
            Track.owner_id == User.user_id,
            isouter=True  # left join
        ).filter(
            User.is_current == True,
            Track.is_current == True,
            Track.track_id.in_(track_ids)
        ).all()

    return query_results


def get_unavailable_tracks_redis_key(spID):
    '''Returns the key used to store the unavailable tracks on a sp'''
    return f"unavailable_tracks_{spID}"

# TODO: what happens when a worker fails? wrap in try/catch? not necessary?


# ####### CELERY TASKS ####### #
@celery.task(name="update_track_is_available", bind=True)
def update_track_is_available(self):
    db = update_track_is_available.db
    redis = update_track_is_available.redis

    content_nodes = fetch_all_registered_content_node_info()

    for node in content_nodes:
        # Keep mapping of spId to set of unavailable tracks
        unavailable_track_ids = fetch_unavailable_track_ids(node.endpoint)
        spID_unavailable_tracks_key = get_unavailable_tracks_redis_key(node.spID)
        redis.sadd(spID_unavailable_tracks_key, unavailable_track_ids)

        # Also keep aggregate list of unavailable tracks
        redis.sadd(ALL_UNAVAILABLE_TRACKS_REDIS_KEY, unavailable_track_ids)

    # Check track availability on all unavailable tracks
    all_unavailable_track_ids = redis.smembers(ALL_UNAVAILABLE_TRACKS_REDIS_KEY)
    for track_id in all_unavailable_track_ids:
        replica_set = query_replica_set_by_track_id(db, [track_id])

        # pass
        # try:
        #     init_task_and_acquire_lock(
        #         logger, db, redis, AGGREGATE_PLAYS_TABLE_NAME, _update_track_is_available
        #     # except Exception as e:
