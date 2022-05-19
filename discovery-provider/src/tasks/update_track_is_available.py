import logging

import requests
from src.tasks.aggregates import init_task_and_acquire_lock
from src.tasks.celery_app import celery

logger = logging.getLogger(__name__)

def _update_track_is_available():
    pass

def fetch_unavailable_track_ids(node):
    resp = requests.get(f"{node}/blacklist/tracks").json()
    unavailable_track_ids = resp['data']['values']
    return unavailable_track_ids

# ####### CELERY TASKS ####### #
@celery.task(name="update_track_is_available", bind=True)
def update_track_is_available(self):
    db = update_track_is_available.db
    redis = update_track_is_available.redis

    pass
    # try:
    #     init_task_and_acquire_lock(
    #         logger, db, redis, AGGREGATE_PLAYS_TABLE_NAME, _update_track_is_available
    #     )
    # except Exception as e:

    
