import logging
import time
from datetime import date, datetime
from typing import Optional

from redis import Redis
from sqlalchemy.orm.session import Session
from web3 import Web3

from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.queries.get_trending_playlists import (
    GetTrendingPlaylistsArgs,
    _get_trending_playlists_with_session,
)
from src.queries.get_trending_tracks import _get_trending_tracks_with_session
from src.queries.get_underground_trending import (
    GetUndergroundTrendingTrackArgs,
    _get_underground_trending_with_session,
)
from src.tasks.aggregates import get_latest_blocknumber
from src.trending_strategies.trending_strategy_factory import TrendingStrategyFactory
from src.trending_strategies.trending_type_and_version import TrendingType
from src.utils import helpers
from src.utils.redis_constants import most_recent_indexed_block_redis_key

logger = logging.getLogger(__name__)

trending_strategy_factory = TrendingStrategyFactory()


def date_to_week(date: date) -> str:
    return date.strftime("%Y-%m-%d")


def get_latest_blocknumber_via_redis(session: Session, redis: Redis) -> Optional[int]:
    # get latest db state from redis cache
    latest_indexed_block_num = redis.get(most_recent_indexed_block_redis_key)
    if latest_indexed_block_num is not None:
        return int(latest_indexed_block_num)

    return get_latest_blocknumber(session)


# The number of users to recieve the trending rewards
TRENDING_LIMIT = 5


def dispatch_trending_challenges(
    challenge_bus: ChallengeEventBus,
    challenge_event: ChallengeEvent,
    latest_blocknumber: int,
    latest_block_datetime: datetime,
    tracks,
    version: str,
    date: date,
    type: TrendingType,
):
    for idx, track in enumerate(tracks):
        challenge_bus.dispatch(
            challenge_event,
            latest_blocknumber,
            latest_block_datetime,
            track["owner_id"],
            {
                "id": track["track_id"],
                "user_id": track["owner_id"],
                "rank": idx + 1,
                "type": str(type),
                "version": str(version),
                "week": date_to_week(date),
            },
        )


def enqueue_trending_challenges(
    session: Session,
    web3: Web3,
    redis: Redis,
    challenge_bus: ChallengeEventBus,
    date: date,
):
    logger.debug(
        "calculate_trending_challenges.py | Start calculating trending challenges"
    )
    update_start = time.time()
    with challenge_bus.use_scoped_dispatch_queue():
        latest_blocknumber = get_latest_blocknumber_via_redis(session, redis)
        if latest_blocknumber is None:
            logger.error(
                "calculate_trending_challenges.py | Unable to get latest block number"
            )
            return

        # subtract final poa block because db is final_poa_block + latest_acdc_block

        latest_block_datetime = datetime.fromtimestamp(
            web3.eth.get_block(latest_blocknumber - helpers.get_final_poa_block())[
                "timestamp"
            ]
        )

        trending_track_versions = trending_strategy_factory.get_versions_for_type(
            TrendingType.TRACKS
        ).keys()

        time_range = "week"
        for version in trending_track_versions:
            strategy = trending_strategy_factory.get_strategy(
                TrendingType.TRACKS, version
            )
            top_tracks = _get_trending_tracks_with_session(
                session, {"time": time_range, "exclude_gated": True}, strategy
            )
            top_tracks = top_tracks[:TRENDING_LIMIT]
            dispatch_trending_challenges(
                challenge_bus,
                ChallengeEvent.trending_track,
                latest_blocknumber,
                latest_block_datetime,
                top_tracks,
                version,
                date,
                TrendingType.TRACKS,
            )

        # Cache underground trending
        underground_trending_versions = trending_strategy_factory.get_versions_for_type(
            TrendingType.UNDERGROUND_TRACKS
        ).keys()
        for version in underground_trending_versions:
            strategy = trending_strategy_factory.get_strategy(
                TrendingType.UNDERGROUND_TRACKS, version
            )
            underground_args: GetUndergroundTrendingTrackArgs = {
                "offset": 0,
                "limit": TRENDING_LIMIT,
            }
            top_tracks = _get_underground_trending_with_session(
                session, underground_args, strategy, False
            )

            dispatch_trending_challenges(
                challenge_bus,
                ChallengeEvent.trending_underground,
                latest_blocknumber,
                latest_block_datetime,
                top_tracks,
                version,
                date,
                TrendingType.UNDERGROUND_TRACKS,
            )

        trending_playlist_versions = trending_strategy_factory.get_versions_for_type(
            TrendingType.PLAYLISTS
        ).keys()
        for version in trending_playlist_versions:
            strategy = trending_strategy_factory.get_strategy(
                TrendingType.PLAYLISTS, version
            )
            playlists_args: GetTrendingPlaylistsArgs = {
                "limit": TRENDING_LIMIT,
                "offset": 0,
                "time": time_range,
            }
            trending_playlists = _get_trending_playlists_with_session(
                session, playlists_args, strategy, False
            )
            for idx, playlist in enumerate(trending_playlists):
                challenge_bus.dispatch(
                    ChallengeEvent.trending_playlist,
                    latest_blocknumber,
                    latest_block_datetime,
                    playlist["playlist_owner_id"],
                    {
                        "id": playlist["playlist_id"],
                        "user_id": playlist["playlist_owner_id"],
                        "rank": idx + 1,
                        "type": str(TrendingType.PLAYLISTS),
                        "version": str(version),
                        "week": date_to_week(date),
                    },
                )

    update_end = time.time()
    update_total = update_end - update_start
    logger.debug(
        f"calculate_trending_challenges.py | Finished calculating trending in {update_total} seconds"
    )


# ####### CELERY TASKS ####### #
# @celery.task(name="calculate_trending_challenges", bind=True)
# @save_duration_metric(metric_group="celery_task")
# def calculate_trending_challenges_task(self, date: Optional[date] = None):
#     """Caches all trending combination of time-range and genre (including no genre)."""
#     if date is None:
#         logger.error("calculate_trending_challenges.py | Must be called with a date")
#         return
#     db = calculate_trending_challenges_task.db
#     redis = calculate_trending_challenges_task.redis
#     challenge_bus = calculate_trending_challenges_task.challenge_event_bus
#     web3 = web3_provider.get_web3()
#     have_lock = False
#     update_lock = redis.lock("calculate_trending_challenges_lock", timeout=7200)
#     try:
#         have_lock = update_lock.acquire(blocking=False)
#         if have_lock:

#             enqueue_trending_challenges(db, web3, redis, challenge_bus, date)
#         else:
#             logger.debug(
#                 "calculate_trending_challenges.py | Failed to acquire index trending lock"
#             )
#     except Exception as e:
#         logger.error(
#             "calculate_trending_challenges.py | Fatal error in main loop", exc_info=True
#         )
#         raise e
#     finally:
#         if have_lock:
#             update_lock.release()
