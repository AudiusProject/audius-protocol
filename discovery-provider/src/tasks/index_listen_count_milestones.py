from datetime import datetime
import logging
import time
from typing import List, Optional
from redis import Redis
from sqlalchemy import func

from src.models import Milestone
from src.models.models import AggregatePlays
from src.tasks.celery_app import celery
from src.utils.session_manager import SessionManager
from src.utils.redis_cache import get_json_cached_key

logger = logging.getLogger(__name__)

CURRENT_PLAY_INDEXING = 'CURRENT_PLAY_INDEXING'
PROCESSED_LISTEN_MILESTONE = 'PROCESSED_LISTEN_MILESTONE'
TRACK_LISTEN_IDS = 'TRACK_LISTEN_IDS'

LISTEN_COUNT_MILESTONE = 'LISTEN_COUNT'
milestone_threshold = [10, 25, 50, 100, 250, 500, 1000, 5000, 10000, 20000, 50000, 100000, 1000000]
next_threshold = dict(zip(milestone_threshold[:-1], milestone_threshold[1:]))


def get_next_track_milestone(play_count: int, prev_milestone: Optional[int]=None):
    """
    Gets the next hightest milstone threshold avaiable given the play count,
    if past the last threshold or given an invalid previous milestone, will return None
    """
    next_milestone = milestone_threshold[0]
    if prev_milestone:
        if prev_milestone in next_threshold:
            next_milestone = next_threshold[prev_milestone]
        else:
            # track is past the last milestone, so return none and stop
            return None

    # If play counts have not passed the next threshold, return None
    if play_count < next_milestone:
        return None

    # If play counts have pasted the next milestone threshold, continue to compare against higher thresholds
    next_next_milestone = next_threshold[next_milestone] if next_milestone in next_threshold else None
    while next_next_milestone and play_count >= next_next_milestone:
        next_milestone = next_next_milestone
        next_next_milestone = next_threshold[next_milestone] if next_milestone in next_threshold else None

    return next_milestone

def get_track_listen_ids(redis) -> List[int]:
    check_track_ids: List[bytes] = list(redis.smembers(TRACK_LISTEN_IDS))
    return [int(track_id.decode()) for track_id in check_track_ids]


def index_listen_count_milestones(db: SessionManager, redis: Redis):
    logger.info(
        "index_listen_count_milestones.py | Start calculating listen count milestones"
    )
    job_start = time.time()
    with db.scoped_session() as session:
        current_play_indexing = get_json_cached_key(redis, CURRENT_PLAY_INDEXING)
        if not current_play_indexing or current_play_indexing['slot'] is None:
            return

        check_track_ids = get_track_listen_ids(redis)

        # Pull off current play indexed slot number from redis
        # Pull off track ids to check from redis
        existing_milestone = (
            session.query(
                Milestone.id,
                func.max(Milestone.threshold)
            )
            .filter(
                Milestone.name == LISTEN_COUNT_MILESTONE,
                Milestone.id.in_(check_track_ids)
            )
            .group_by(Milestone.id)
            .all()
        )

        aggregate_play_counts = (
            session.query(
                AggregatePlays.play_item_id,
                AggregatePlays.count,
            )
            .filter(
                AggregatePlays.play_item_id.in_(check_track_ids)
            ).all()
        )

        milestones = dict(existing_milestone)
        play_counts = dict(aggregate_play_counts)

        # Bulk fetch track's next milestone threshold
        listen_milestones = []
        for track_id in check_track_ids:
            current_milestone = None
            if track_id in milestones:
                current_milestone = milestones[track_id]
            next_milestone_threshold = get_next_track_milestone(play_counts[track_id], current_milestone)
            if next_milestone_threshold:
                listen_milestones.append(Milestone(
                    id=track_id,
                    threshold=next_milestone_threshold,
                    name=LISTEN_COUNT_MILESTONE,
                    slot=current_play_indexing['slot'],
                    timestamp=datetime.utcfromtimestamp(int(current_play_indexing['timestamp']))
                ))

        if listen_milestones:
            session.bulk_save_objects(listen_milestones)

        redis.set(PROCESSED_LISTEN_MILESTONE, current_play_indexing['slot'])
        if check_track_ids:
            redis.srem(TRACK_LISTEN_IDS, *check_track_ids)


    job_end = time.time()
    job_total = job_end - job_start
    logger.info(
        f"index_listen_count_milestones.py | Finished calculating trending in {job_total} seconds",
        extra={"job": "index_listen_count_milestones", "total_time": job_total},
    )


######## CELERY TASKS ########
@celery.task(name="index_listen_count_milestones", bind=True)
def index_listen_count_milestones_task(self):
    """Caches all trending combination of time-range and genre (including no genre)."""
    db = index_listen_count_milestones_task.db
    redis = index_listen_count_milestones_task.redis
    have_lock = False
    # Max timeout is 60 sec * 10 min
    update_lock = redis.lock("index_listen_count_milestones_lock", timeout=600)
    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            index_listen_count_milestones(db, redis)
        else:
            logger.info(
                "index_listen_count_milestones.py | Failed to acquire index trending lock"
            )
    except Exception as e:
        logger.error(
            "index_listen_count_milestones.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
