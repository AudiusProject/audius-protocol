from datetime import datetime
import logging
import time
from redis import Redis
from sqlalchemy.orm.session import Session
from sqlalchemy.sql.sqltypes import DateTime

from src.models import Block
from src.tasks.celery_app import celery
from src.queries.get_trending_tracks import (
    make_trending_cache_key,
    generate_unpopulated_trending,
)
from src.queries.get_trending_playlists import (
    make_trending_cache_key as make_trending_cache_key_playlists,
    make_get_unpopulated_playlists,
)
from src.utils.redis_cache import pickle_and_set
from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.trending_strategies.trending_strategy_factory import TrendingStrategyFactory
from src.trending_strategies.trending_type_and_version import TrendingType
from src.queries.get_underground_trending import (
    make_underground_trending_cache_key,
    make_get_unpopulated_tracks,
)
from src.utils.redis_constants import most_recent_indexed_block_redis_key
from src.utils.session_manager import SessionManager

logger = logging.getLogger(__name__)

trending_strategy_factory = TrendingStrategyFactory()


def get_latest_blocknumber(session: Session, redis: Redis) -> int:
    # get latest db state from redis cache
    latest_indexed_block_num = redis.get(most_recent_indexed_block_redis_key)
    if latest_indexed_block_num is not None:
        return int(latest_indexed_block_num)
    db_block_query = (
        session.query(Block.number).filter(Block.is_current == True).first()
    )
    return db_block_query[0]


# The number of users to recieve the trending rewards
TRENDING_LIMIT = 5


def dispatch_trending_challenges(
    challenge_bus: ChallengeEventBus,
    challenge_event: ChallengeEvent,
    latest_blocknumber: int,
    tracks,
    version: str,
    date: datetime,
):
    for idx, track in enumerate(tracks):
        challenge_bus.dispatch(
            challenge_event,
            latest_blocknumber,
            track["owner_id"],
            {
                "id": track["track_id"],
                "user_id": track["owner_id"],
                "rank": idx + 1,
                "type": str(TrendingType.TRACKS),
                "version": str(version),
                "week": str(date),
            },
        )


def enqueue_trending_challenges(
    db: SessionManager, redis: Redis, challenge_bus: ChallengeEventBus, date: datetime
):
    logger.info(
        "calculate_trending_challenges.py | Start calculating trending challenges"
    )
    update_start = time.time()
    with db.scoped_session() as session, challenge_bus.use_scoped_dispatch_queue():

        latest_blocknumber = get_latest_blocknumber(session, redis)

        trending_track_versions = trending_strategy_factory.get_versions_for_type(
            TrendingType.TRACKS
        ).keys()

        genre = None
        time_range = "week"

        for version in trending_track_versions:
            strategy = trending_strategy_factory.get_strategy(
                TrendingType.TRACKS, version
            )
            res = generate_unpopulated_trending(session, genre, time_range, strategy)

            key = make_trending_cache_key(time_range, genre, version)
            pickle_and_set(redis, key, res)
            top_tracks = res[0]
            top_tracks = top_tracks[:TRENDING_LIMIT]
            dispatch_trending_challenges(
                challenge_bus,
                ChallengeEvent.trending_track,
                latest_blocknumber,
                top_tracks,
                version,
                date,
            )

        # Cache underground trending
        underground_trending_versions = trending_strategy_factory.get_versions_for_type(
            TrendingType.UNDERGROUND_TRACKS
        ).keys()
        for version in underground_trending_versions:
            strategy = trending_strategy_factory.get_strategy(
                TrendingType.UNDERGROUND_TRACKS, version
            )
            res = make_get_unpopulated_tracks(session, redis, strategy)()
            key = make_underground_trending_cache_key(version)
            pickle_and_set(redis, key, res)
            top_underground_tracks = res[0]
            top_underground_tracks = top_underground_tracks[:TRENDING_LIMIT]
            dispatch_trending_challenges(
                challenge_bus,
                ChallengeEvent.trending_underground,
                latest_blocknumber,
                top_tracks,
                version,
                date,
            )

        trending_playlist_versions = trending_strategy_factory.get_versions_for_type(
            TrendingType.PLAYLISTS
        ).keys()
        for version in trending_playlist_versions:
            strategy = trending_strategy_factory.get_strategy(
                TrendingType.PLAYLISTS, version
            )
            key = make_trending_cache_key_playlists(time_range, strategy.version)
            res = make_get_unpopulated_playlists(session, time_range, strategy)()
            pickle_and_set(redis, key, res)
            top_playlists = res[0]
            top_playlists = top_playlists[:TRENDING_LIMIT]
            for idx, playlist in enumerate(top_playlists):
                challenge_bus.dispatch(
                    ChallengeEvent.trending_playlist,
                    latest_blocknumber,
                    playlist["playlist_owner_id"],
                    {
                        "id": playlist["playlist_id"],
                        "user_id": playlist["playlist_owner_id"],
                        "rank": idx + 1,
                        "type": str(TrendingType.PLAYLISTS),
                        "version": str(version),
                        "week": str(date),
                    },
                )

    update_end = time.time()
    update_total = update_end - update_start
    logger.info(
        f"calculate_trending_challenges.py | Finished calculating trending in {update_total} seconds"
    )


######## CELERY TASKS ########
@celery.task(name="calculate_trending_challenges", bind=True)
def calculate_trending_challenges_task(self, date=None):
    """Caches all trending combination of time-range and genre (including no genre)."""
    if date is None:
        logger.error("calculate_trending_challenges.py | Must be called with a date")
        return
    db = calculate_trending_challenges_task.db
    redis = calculate_trending_challenges_task.redis
    challenge_bus = calculate_trending_challenges_task.challenge_event_bus
    have_lock = False
    update_lock = redis.lock("calculate_trending_challenges_lock", timeout=7200)
    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            enqueue_trending_challenges(db, redis, challenge_bus, date)
        else:
            logger.info(
                "calculate_trending_challenges.py | Failed to acquire index trending lock"
            )
    except Exception as e:
        logger.error(
            "calculate_trending_challenges.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
