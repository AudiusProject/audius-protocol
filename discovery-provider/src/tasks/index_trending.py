import logging
import time
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from redis import Redis
from sqlalchemy.orm.session import Session
from src.models.indexing.block import Block
from src.models.tracks.track import Track
from src.queries.get_trending_tracks import (
    generate_unpopulated_trending,
    generate_unpopulated_trending_from_mat_views,
    make_trending_cache_key,
)
from src.queries.get_underground_trending import (
    make_get_unpopulated_tracks,
    make_underground_trending_cache_key,
)
from src.tasks.celery_app import celery
from src.trending_strategies.trending_strategy_factory import TrendingStrategyFactory
from src.trending_strategies.trending_type_and_version import TrendingType
from src.utils.config import shared_config
from src.utils.prometheus_metric import (
    PrometheusMetric,
    PrometheusMetricNames,
    PrometheusRegistry,
    save_duration_metric,
)
from src.utils.redis_cache import set_json_cached_key
from src.utils.redis_constants import trending_tracks_last_completion_redis_key
from src.utils.session_manager import SessionManager
from web3 import Web3

logger = logging.getLogger(__name__)
time_ranges = ["week", "month", "year"]

# Time in seconds between trending updates
UPDATE_TRENDING_DURATION_DIFF_SEC = int(
    shared_config["discprov"]["trending_refresh_seconds"]
)

genre_allowlist = {
    "Acoustic",
    "Alternative",
    "Ambient",
    "Audiobooks",
    "Blues",
    "Classical",
    "Comedy",
    "Country",
    "Deep House",
    "Devotional",
    "Disco",
    "Downtempo",
    "Drum & Bass",
    "Dubstep",
    "Electro",
    "Electronic",
    "Experimental",
    "Folk",
    "Funk",
    "Future Bass",
    "Future House",
    "Glitch Hop",
    "Hardstyle",
    "Hip-Hop/Rap",
    "House",
    "Jazz",
    "Jersey Club",
    "Jungle",
    "Kids",
    "Latin",
    "Lo-Fi",
    "Metal",
    "Moombahton",
    "Podcasts",
    "Pop",
    "Progressive House",
    "Punk",
    "R&B/Soul",
    "Reggae",
    "Rock",
    "Soundtrack",
    "Spoken Word",
    "Tech House",
    "Techno",
    "Trance",
    "Trap",
    "Tropical House",
    "Vaporwave",
    "World",
}


def get_genres(session: Session) -> List[str]:
    """Returns all genres"""
    genres: List[Tuple[str]] = (session.query(Track.genre).distinct(Track.genre)).all()
    genres = filter(  # type: ignore
        lambda x: x[0] is not None and x[0] != "" and x[0] in genre_allowlist, genres
    )
    return list(map(lambda x: x[0], genres))


trending_strategy_factory = TrendingStrategyFactory()

AGGREGATE_INTERVAL_PLAYS = "aggregate_interval_plays"
TRENDING_PARAMS = "trending_params"


def update_view(session: Session, mat_view_name: str):
    start_time = time.time()
    metric = PrometheusMetric(
        PrometheusRegistry[PrometheusMetricNames.UPDATE_TRENDING_VIEW_DURATION_SECONDS]
    )
    session.execute(f"REFRESH MATERIALIZED VIEW {mat_view_name}")
    update_time = time.time() - start_time
    metric.save_time({"mat_view_name": mat_view_name})
    logger.info(
        f"index_trending.py | Finished updating {mat_view_name} in: {time.time()-start_time} sec",
        extra={
            "job": "index_trending",
            "update_time": update_time,
            "mat_view_name": mat_view_name,
        },
    )


def index_trending(self, db: SessionManager, redis: Redis, timestamp):
    logger.info("index_trending.py | starting indexing")
    update_start = time.time()
    metric = PrometheusMetric(
        PrometheusRegistry[PrometheusMetricNames.INDEX_TRENDING_DURATION_SECONDS]
    )
    with db.scoped_session() as session:
        genres = get_genres(session)

        # Make sure to cache empty genre
        genres.append(None)  # type: ignore

        trending_track_versions = trending_strategy_factory.get_versions_for_type(
            TrendingType.TRACKS
        ).keys()

        update_view(session, AGGREGATE_INTERVAL_PLAYS)
        update_view(session, TRENDING_PARAMS)
        for version in trending_track_versions:
            strategy = trending_strategy_factory.get_strategy(
                TrendingType.TRACKS, version
            )
            if strategy.use_mat_view:
                strategy.update_track_score_query(session)

        for version in trending_track_versions:
            strategy = trending_strategy_factory.get_strategy(
                TrendingType.TRACKS, version
            )
            for genre in genres:
                for time_range in time_ranges:
                    cache_start_time = time.time()
                    if strategy.use_mat_view:
                        res = generate_unpopulated_trending_from_mat_views(
                            session, genre, time_range, strategy
                        )
                    else:
                        res = generate_unpopulated_trending(
                            session, genre, time_range, strategy
                        )
                    key = make_trending_cache_key(time_range, genre, version)
                    set_json_cached_key(redis, key, res)
                    cache_end_time = time.time()
                    total_time = cache_end_time - cache_start_time
                    logger.info(
                        f"index_trending.py | Cached trending ({version.name} version) \
                        for {genre}-{time_range} in {total_time} seconds"
                    )

        # Cache underground trending
        underground_trending_versions = trending_strategy_factory.get_versions_for_type(
            TrendingType.UNDERGROUND_TRACKS
        ).keys()
        for version in underground_trending_versions:
            strategy = trending_strategy_factory.get_strategy(
                TrendingType.UNDERGROUND_TRACKS, version
            )
            cache_start_time = time.time()
            res = make_get_unpopulated_tracks(session, redis, strategy)()
            key = make_underground_trending_cache_key(version)
            set_json_cached_key(redis, key, res)
            cache_end_time = time.time()
            total_time = cache_end_time - cache_start_time
            logger.info(
                f"index_trending.py | Cached underground trending ({version.name} version) \
                in {total_time} seconds"
            )

    update_end = time.time()
    update_total = update_end - update_start
    metric.save_time()
    logger.info(
        f"index_trending.py | Finished indexing trending in {update_total} seconds",
        extra={"job": "index_trending", "total_time": update_total},
    )
    # Update cache key to track the last time trending finished indexing
    redis.set(trending_tracks_last_completion_redis_key, int(update_end))
    set_last_trending_datetime(redis, timestamp)


last_trending_timestamp = "last_trending_timestamp"


def get_last_trending_datetime(redis: Redis):
    dt = redis.get(last_trending_timestamp)
    if dt:
        return datetime.fromtimestamp(int(dt.decode()))
    return None


def set_last_trending_datetime(redis: Redis, timestamp: int):
    redis.set(last_trending_timestamp, timestamp)


def floor_time(dt: datetime, interval_seconds: int):
    """
    Floor a datetime object to a time-span in seconds
    interval_seconds: Closest number of seconds to floor to

    For example, if floor_time is invoked with `interval_seconds` of 15,
    the provided datetime is rounded down to the nearest 15 minute interval.
    E.g. 10:48 rounds to 10:45, 11:02 rounds to 11:00, etc.
    """
    seconds = (dt.replace(tzinfo=None) - dt.min).seconds
    rounding = seconds // interval_seconds * interval_seconds
    return dt + timedelta(0, rounding - seconds, -dt.microsecond)


def get_should_update_trending(
    db: SessionManager, web3: Web3, redis: Redis, interval_seconds: int
) -> Optional[int]:
    """
    Checks if the trending job should re-run based off the last trending run's timestamp and
    the most recently indexed block's timestamp.
    If the most recently indexed block (rounded down to the nearest interval) is `interval_seconds`
    ahead of the last trending job run, then the job should re-run.
    The function returns the an int, representing the timestamp, if the jobs should re-run, else None
    """
    with db.scoped_session() as session:
        current_db_block = (
            session.query(Block.blockhash).filter(Block.is_current == True).first()
        )
        current_block = web3.eth.get_block(current_db_block[0], True)
        current_timestamp = current_block["timestamp"]
        block_datetime = floor_time(
            datetime.fromtimestamp(current_timestamp), interval_seconds
        )

        last_trending_datetime = get_last_trending_datetime(redis)
        if not last_trending_datetime:
            return int(block_datetime.timestamp())

        duration_since_last_index = block_datetime - last_trending_datetime
        if duration_since_last_index.total_seconds() >= interval_seconds:
            return int(block_datetime.timestamp())

    return None


# ####### CELERY TASKS ####### #
@celery.task(name="index_trending", bind=True)
@save_duration_metric(metric_group="celery_task")
def index_trending_task(self):
    """Caches all trending combination of time-range and genre (including no genre)."""
    db = index_trending_task.db
    redis = index_trending_task.redis
    web3 = index_trending_task.web3
    have_lock = False
    update_lock = redis.lock("index_trending_lock", timeout=86400)
    try:
        should_update_timestamp = get_should_update_trending(
            db, web3, redis, UPDATE_TRENDING_DURATION_DIFF_SEC
        )
        have_lock = update_lock.acquire(blocking=False)
        if should_update_timestamp and have_lock:
            index_trending(self, db, redis, should_update_timestamp)
        else:
            logger.info(
                f"index_trending.py | \
                skip indexing: have lock {have_lock}, \
                shoud update {should_update_timestamp}"
            )
    except Exception as e:
        logger.error("index_trending.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
