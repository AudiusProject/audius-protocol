import logging

import requests

# from src.tasks.aggregates import init_task_and_acquire_lock
from src.tasks.celery_app import celery
from src.utils.eth_contracts_helpers import fetch_all_registered_content_node_info

logger = logging.getLogger(__name__)


ALL_DELISTED_TRACKS_REDIS_KEY = 'delisted_tracks_all'


def _update_track_is_available():
    pass


def fetch_unavailable_track_ids(node):
    resp = requests.get(f"{node}/blacklist/tracks").json()
    unavailable_track_ids = resp["data"]["values"]
    return unavailable_track_ids


def get_replica_set(track_id):
    # select 
    #     tracks.track_id, users.user_id, users.primary_id, users.secondary_ids 
    # from 
    #     "tracks" 
    # left join "users" on tracks.owner_id = users.user_id 
    # where 
    #     users.is_current = true  and 
    #     tracks.track_id in (888,2552,353,467,53)
    # limit 100;
    pass


def get_delisted_tracks_per_spID_redis_key(spID):
    return f"delisted_tracks_{spID}"


# ####### CELERY TASKS ####### #
@celery.task(name="update_track_is_available", bind=True)
def update_track_is_available(self):
    # db = update_track_is_available.db
    redis = update_track_is_available.redis

    content_nodes = fetch_all_registered_content_node_info()

    for node in content_nodes:
        # Keep mapping of spId to the unavailable tracks
        unavailable_track_ids = fetch_unavailable_track_ids(node.endpoint)
        key = get_delisted_tracks_per_spID_redis_key(node.spID) 
        redis.sadd(key, unavailable_track_ids)

        # Also keep aggregate list of unavailable tracks
        redis.sadd(ALL_DELISTED_TRACKS_REDIS_KEY, unavailable_track_ids)

    # Check track availability on all delisted tracks
    all_delisted_track_ids = redis.smembers(ALL_DELISTED_TRACKS_REDIS_KEY)
    for track_id in all_delisted_track_ids:
        pass
        # replica_set = get_replica_set(track_id)
        # try:
        #     init_task_and_acquire_lock(
        #         logger, db, redis, AGGREGATE_PLAYS_TABLE_NAME, _update_track_is_available
        #     # except Exception as e:
