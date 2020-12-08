import logging
import time
from src.models import Track
from src.tasks.celery_app import celery
from src.tasks.generate_trending import generate_trending
from src.queries.get_unpopulated_tracks import get_unpopulated_tracks
from src.queries.get_trending_tracks import z, make_trending_cache_key
from src.utils.redis_cache import pickle_and_set

logger = logging.getLogger(__name__)

# TODO: this limit gonna need to go higher
TRENDING_LIMIT = 100

def get_genres(session):
    """Returns all genres, in lowercase"""
    genres = (
        session.query(
            Track.genre
        ).distinct(
            Track.genre
        )).all()
    genres = filter(lambda x: x[0] is not None and x[0] != "", genres)
    return list(map(lambda x: x[0].lower(), genres))

time_ranges = ["week", "month", "year"]

# TODO: make sure limit + offset are working correctly for this...
def generate_unpopulated_trending(session, genre, time_range):
    trending_tracks = generate_trending(
        session, time_range, genre,
        TRENDING_LIMIT, 0)

    track_scores = [z(time_range, track) for track in trending_tracks['listen_counts']]
    sorted_track_scores = sorted(track_scores, key=lambda k: k['score'], reverse=True)

    track_ids = [track['track_id'] for track in sorted_track_scores]

    tracks = get_unpopulated_tracks(session, track_ids)
    return (tracks, track_ids)

def update_karma(self, db, redis):
    logger.info('Running update karma')
    update_start = time.time()
    with db.scoped_session() as session:
        genres = get_genres(session)
        # TODO: can just append this
        genres.insert(0, None)
        for genre in genres:
            for time_range in time_ranges:
                cache_start_time = time.time()
                res = generate_unpopulated_trending(session, genre, time_range)
                key = make_trending_cache_key(time_range, genre)
                pickle_and_set(redis, key, res)
                cache_end_time = time.time()
                total_time = cache_end_time - cache_start_time
                logger.info(f"Cached trending for {genre}-{time_range} in {total_time} seconds")
    update_end = time.time()
    update_total = update_end - update_start
    logger.info(f"Finished update karma in {update_total} seconds")

######## CELERY TASKS ########
@celery.task(name="update_karma", bind=True)
def update_karma_task(self):
    db = update_karma_task.db
    redis = update_karma_task.redis
    have_lock = False
    update_lock = redis.lock("karma_lock", timeout=7200)
    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            update_karma(self, db, redis)
        else:
            logger.info("karma.py | Failed to acquire karma lock")
    except Exception as e:
        logger.error("karma.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()