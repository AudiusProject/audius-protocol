import logging
import time
from src.models import Track
from src.tasks.celery_app import celery
from src.queries.get_trending_tracks import make_trending_cache_key, generate_unpopulated_trending
from src.utils.redis_cache import pickle_and_set
from src.utils.redis_constants import trending_tracks_last_completion_redis_key
from src.utils.trending_selector import TrendingSelector
from src.utils.trending_strategy import TrendingType
from src.queries.get_underground_trending import make_underground_trending_cache_key, make_get_unpopulated_tracks

logger = logging.getLogger(__name__)
time_ranges = ["week", "month", "year"]

genre_allowlist = {
    'Acoustic',
    'Alternative',
    'Ambient',
    'Audiobooks',
    'Blues',
    'Classical',
    'Comedy',
    'Country',
    'Deep House',
    'Devotional',
    'Disco',
    'Downtempo',
    'Drum & Bass',
    'Dubstep',
    'Electro',
    'Electronic',
    'Experimental',
    'Folk',
    'Funk',
    'Future Bass',
    'Future House',
    'Glitch Hop',
    'Hardstyle',
    'Hip-Hop/Rap',
    'House',
    'Jazz',
    'Jersey Club',
    'Jungle',
    'Kids',
    'Latin',
    'Metal',
    'Moombahton',
    'Podcasts',
    'Pop',
    'Progressive House',
    'Punk',
    'R&B/Soul',
    'Reggae',
    'Rock',
    'Soundtrack',
    'Spoken Word',
    'Tech House',
    'Techno',
    'Trance',
    'Trap',
    'Tropical House',
    'Vaporwave',
    'World'
}

def get_genres(session):
    """Returns all genres"""
    genres = (
        session.query(
            Track.genre
        ).distinct(
            Track.genre
        )).all()
    genres = filter(lambda x: x[0] is not None and x[0] != "" and x[0] in genre_allowlist, genres)
    return list(map(lambda x: x[0], genres))


def index_trending(self, db, redis):
    logger.info('index_trending.py | starting indexing')
    update_start = time.time()
    trending_selector = TrendingSelector()
    with db.scoped_session() as session:
        genres = get_genres(session)

        # Make sure to cache empty genre
        genres.append(None)

        strategy = trending_selector.get_strategy(TrendingType.TRACKS)
        for genre in genres:
            for time_range in time_ranges:
                cache_start_time = time.time()
                res = generate_unpopulated_trending(session, genre, time_range, strategy)
                key = make_trending_cache_key(time_range, genre)
                pickle_and_set(redis, key, res)
                cache_end_time = time.time()
                total_time = cache_end_time - cache_start_time
                logger.info(f"index_trending.py | Cached trending for {genre}-{time_range} in {total_time} seconds")

        # Cache underground trending
        cache_start_time = time.time()
        strategy = trending_selector.get_strategy(TrendingType.UNDERGROUND_TRACKS)
        res = make_get_unpopulated_tracks(session, redis, strategy)()
        key = make_underground_trending_cache_key()
        pickle_and_set(redis, key, res)
        cache_end_time = time.time()
        logger.info(f"index_trending.py | Cached underground trending in {total_time} seconds")

    update_end = time.time()
    update_total = update_end - update_start
    logger.info(f"index_trending.py | Finished indexing trending in {update_total} seconds")
    # Update cache key to track the last time trending finished indexing
    redis.set(trending_tracks_last_completion_redis_key, int(update_end))

######## CELERY TASKS ########
@celery.task(name="index_trending", bind=True)
def index_trending_task(self):
    """Caches all trending combination of time-range and genre (including no genre)."""
    db = index_trending_task.db
    redis = index_trending_task.redis
    have_lock = False
    update_lock = redis.lock("index_trending_lock", timeout=7200)
    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            index_trending(self, db, redis)
        else:
            logger.info("index_trending.py | Failed to acquire index trending lock")
    except Exception as e:
        logger.error("index_trending.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
