import logging
import time
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from redis import Redis
from sqlalchemy import bindparam, text
from sqlalchemy.orm.session import Session
from web3 import Web3

from src.models.indexing.block import Block
from src.models.notifications.notification import Notification
from src.models.tracks.track import Track
from src.queries.generate_unpopulated_trending_tracks import (
    generate_unpopulated_trending_from_mat_views,
    make_trending_tracks_cache_key,
)
from src.queries.get_trending_tracks import _get_trending_tracks_with_session
from src.queries.get_underground_trending import (
    _get_underground_trending_with_session,
    make_get_unpopulated_tracks,
    make_underground_trending_cache_key,
)
from src.tasks.celery_app import celery
from src.tasks.index_tastemaker_notifications import index_tastemaker_notifications
from src.trending_strategies.trending_strategy_factory import TrendingStrategyFactory
from src.trending_strategies.trending_type_and_version import TrendingType
from src.utils.config import shared_config
from src.utils.hardcoded_data import genre_allowlist
from src.utils.helpers import get_adjusted_block
from src.utils.prometheus_metric import (
    PrometheusMetric,
    PrometheusMetricNames,
    save_duration_metric,
)
from src.utils.redis_cache import set_json_cached_key
from src.utils.redis_constants import trending_tracks_last_completion_redis_key
from src.utils.session_manager import SessionManager
from src.utils.web3_provider import get_web3

logger = logging.getLogger(__name__)
time_ranges = ["week", "month", "year"]

# Time in seconds between trending updates
UPDATE_TRENDING_DURATION_DIFF_SEC = int(
    shared_config["discprov"]["trending_refresh_seconds"]
)


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
        PrometheusMetricNames.UPDATE_TRENDING_VIEW_DURATION_SECONDS
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
    logger.debug("index_trending.py | starting indexing")
    update_start = time.time()
    metric = PrometheusMetric(PrometheusMetricNames.INDEX_TRENDING_DURATION_SECONDS)
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
            strategy.update_track_score_query(session)

        for version in trending_track_versions:
            strategy = trending_strategy_factory.get_strategy(
                TrendingType.TRACKS, version
            )
            for genre in genres:
                for time_range in time_ranges:
                    cache_start_time = time.time()
                    res = generate_unpopulated_trending_from_mat_views(
                        session=session,
                        genre=genre,
                        time_range=time_range,
                        strategy=strategy,
                    )
                    key = make_trending_tracks_cache_key(time_range, genre, version)
                    set_json_cached_key(redis, key, res)
                    cache_end_time = time.time()
                    total_time = cache_end_time - cache_start_time
                    logger.debug(
                        f"index_trending.py | Cached trending ({version.name} version) \
                        for {genre}-{time_range} in {total_time} seconds"
                    )
            # Cache premium tracks
            cache_start_time = time.time()
            res = generate_unpopulated_trending_from_mat_views(
                session=session,
                genre=genre,
                time_range="week",
                strategy=strategy,
                usdc_purchase_only=True,
            )
            key = make_trending_tracks_cache_key("week", None, strategy.version)
            key += ":usdc_purchase_only"
            set_json_cached_key(redis, key, res)
            cache_end_time = time.time()
            total_time = cache_end_time - cache_start_time
            logger.debug(
                f"index_trending.py | Cached premium tracks ({version.name} version) \
                -in {total_time} seconds"
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
            logger.debug(
                f"index_trending.py | Cached underground trending ({version.name} version) \
                in {total_time} seconds"
            )

    update_end = time.time()
    update_total = update_end - update_start
    metric.save_time()
    logger.debug(
        f"index_trending.py | Finished indexing trending in {update_total} seconds",
        extra={"job": "index_trending", "total_time": update_total},
    )
    # Update cache key to track the last time trending finished indexing
    redis.set(trending_tracks_last_completion_redis_key, int(update_end))
    set_last_trending_datetime(redis, timestamp)

    top_trending_tracks = get_top_trending_to_notify(db)

    index_trending_notifications(db, timestamp, top_trending_tracks)
    index_tastemaker_notifications(db, top_trending_tracks)
    index_trending_underground_notifications(db, timestamp)


def get_top_trending_to_notify(db):
    # The number of tracks to notify for in the top
    NOTIFICATIONS_TRACK_LIMIT = 5
    with db.scoped_session() as session:
        trending_tracks = _get_trending_tracks_with_session(
            session,
            {"time": "week", "exclude_gated": True},
            trending_strategy_factory.get_strategy(TrendingType.TRACKS),
        )
        top_trending = trending_tracks[:NOTIFICATIONS_TRACK_LIMIT]
        return top_trending


def index_trending_notifications(
    db: SessionManager, timestamp: int, top_trending: List[dict]
):
    # Get the top 5 trending tracks from the new trending calculations
    # Get the most recent trending tracks notifications
    # Calculate any diff and write the new notifications if the trending track has moved up in rank
    # Skip if the user was notified of the trending track within the last TRENDING_INTERVAL_HOURS
    # Skip If the new rank is not less than the old rank, skip
    #   ie. Skip if track moved from #2 trending to #3 trending or stayed the same
    # The number of tracks to notify for in the top
    with db.scoped_session() as session:
        top_trending_track_ids = [str(t["track_id"]) for t in top_trending]

        previous_trending_notifications = (
            session.query(Notification)
            .filter(
                Notification.type == "trending",
                Notification.specifier.in_(top_trending_track_ids),
            )
            .all()
        )

        latest_notification_query = text(
            """
                SELECT 
                    DISTINCT ON (specifier) specifier,
                    timestamp,
                    data
                FROM notification
                WHERE 
                    type=:type AND
                    specifier in :track_ids
                ORDER BY
                    specifier desc,
                    timestamp desc
            """
        )
        latest_notification_query = latest_notification_query.bindparams(
            bindparam("track_ids", expanding=True)
        )

        previous_trending_notifications = session.execute(
            latest_notification_query,
            {"track_ids": top_trending_track_ids, "type": "trending"},
        )
        previous_trending = {
            n[0]: {"timestamp": n[1], **n[2]} for n in previous_trending_notifications
        }

        notifications = []

        # Do not send notifications for the same track trending within 24 hours
        NOTIFICATION_INTERVAL_SEC = 60 * 60 * 24

        for index, track in enumerate(top_trending):
            track_id = track["track_id"]
            rank = index + 1
            previous_track_notification = previous_trending.get(str(track["track_id"]))
            if previous_track_notification is not None:
                current_datetime = datetime.fromtimestamp(timestamp)
                prev_notification_datetime = datetime.fromtimestamp(
                    previous_track_notification["timestamp"].timestamp()
                )
                if (
                    current_datetime - prev_notification_datetime
                ).total_seconds() < NOTIFICATION_INTERVAL_SEC:
                    continue
                prev_rank = previous_track_notification["rank"]
                if prev_rank <= rank:
                    continue
            notifications.append(
                {
                    "owner_id": track["owner_id"],
                    "group_id": f"trending:time_range:week:genre:all:rank:{rank}:track_id:{track_id}:timestamp:{timestamp}",
                    "track_id": track_id,
                    "rank": rank,
                }
            )

        session.bulk_save_objects(
            [
                Notification(
                    user_ids=[n["owner_id"]],
                    timestamp=datetime.fromtimestamp(timestamp),
                    type="trending",
                    group_id=n["group_id"],
                    specifier=n["track_id"],
                    data={
                        "time_range": "week",
                        "genre": "all",
                        "rank": n["rank"],
                        "track_id": n["track_id"],
                    },
                )
                for n in notifications
            ]
        )
        logger.debug(
            "index_trending.py | Created trending notifications",
            extra={"job": "index_trending", "subtask": "trending notification"},
        )
        return top_trending


last_trending_timestamp = "last_trending_timestamp"


def index_trending_underground_notifications(db: SessionManager, timestamp: int):
    # Get the top 5 trending tracks from the new trending calculations
    # Get the most recent trending tracks notifications
    # Calculate any diff and write the new notifications if the trending track has moved up in rank
    # Skip if the user was notified of the trending track within the last TRENDING_INTERVAL_HOURS
    # Skip If the new rank is not less than the old rank, skip
    #   ie. Skip if track moved from #2 trending to #3 trending or stayed the same
    trending_strategy_factory = TrendingStrategyFactory()
    # The number of tracks to notify for in the top
    NOTIFICATIONS_TRACK_LIMIT = 5
    with db.scoped_session() as session:
        top_trending = _get_underground_trending_with_session(
            session,
            {"offset": 0, "limit": NOTIFICATIONS_TRACK_LIMIT},
            trending_strategy_factory.get_strategy(TrendingType.UNDERGROUND_TRACKS),
            False,
        )
        top_trending_track_ids = [str(t["track_id"]) for t in top_trending]

        previous_trending_notifications = (
            session.query(Notification)
            .filter(
                Notification.type == "trending_underground",
                Notification.specifier.in_(top_trending_track_ids),
            )
            .all()
        )

        latest_notification_query = text(
            """
                SELECT 
                    DISTINCT ON (specifier) specifier,
                    timestamp,
                    data
                FROM notification
                WHERE 
                    type=:type AND
                    specifier in :track_ids
                ORDER BY
                    specifier desc,
                    timestamp desc
            """
        )
        latest_notification_query = latest_notification_query.bindparams(
            bindparam("track_ids", expanding=True)
        )

        previous_trending_notifications = session.execute(
            latest_notification_query,
            {"track_ids": top_trending_track_ids, "type": "trending_underground"},
        )
        previous_trending = {
            n[0]: {"timestamp": n[1], **n[2]} for n in previous_trending_notifications
        }

        notifications = []

        # Do not send notifications for the same track trending within 24 hours
        NOTIFICATION_INTERVAL_SEC = 60 * 60 * 24

        for index, track in enumerate(top_trending):
            track_id = track["track_id"]
            rank = index + 1
            previous_track_notification = previous_trending.get(str(track["track_id"]))
            if previous_track_notification is not None:
                current_datetime = datetime.fromtimestamp(timestamp)
                prev_notification_datetime = datetime.fromtimestamp(
                    previous_track_notification["timestamp"].timestamp()
                )
                if (
                    current_datetime - prev_notification_datetime
                ).total_seconds() < NOTIFICATION_INTERVAL_SEC:
                    continue
                prev_rank = previous_track_notification["rank"]
                if prev_rank <= rank:
                    continue
            notifications.append(
                {
                    "owner_id": track["owner_id"],
                    "group_id": f"trending_underground:time_range:week:genre:all:rank:{rank}:track_id:{track_id}:timestamp:{timestamp}",
                    "track_id": track_id,
                    "rank": rank,
                }
            )

        session.bulk_save_objects(
            [
                Notification(
                    user_ids=[n["owner_id"]],
                    timestamp=datetime.fromtimestamp(timestamp),
                    type="trending_underground",
                    group_id=n["group_id"],
                    specifier=n["track_id"],
                    data={
                        "time_range": "week",
                        "genre": "all",
                        "rank": n["rank"],
                        "track_id": n["track_id"],
                    },
                )
                for n in notifications
            ]
        )
        logger.debug(
            "index_trending.py | Created underground-trending notifications",
            extra={"job": "index_trending", "subtask": "trending notification"},
        )


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


def find_min_block_above_timestamp(block_number: int, min_timestamp: datetime, web3):
    """
    finds the minimum block number above a timestamp
    This is needed to ensure consistency across discovery nodes on the timestamp/blocknumber
    of a notification for updates to trending track
    returns a tuple of the blocknumber and timestamp
    """
    curr_block_number = block_number
    block = get_adjusted_block(web3, block_number)
    while datetime.fromtimestamp(block["timestamp"]) > min_timestamp:
        prev_block = get_adjusted_block(web3, curr_block_number - 1)
        prev_timestamp = datetime.fromtimestamp(prev_block["timestamp"])
        if prev_timestamp >= min_timestamp:
            block = prev_block
            curr_block_number -= 1
        else:
            return block

    return block


def get_should_update_trending(
    db: SessionManager, web3: Web3, redis: Redis, interval_seconds: int
) -> Tuple[Optional[int], Optional[int]]:
    """
    Checks if the trending job should re-run based off the last trending run's timestamp and
    the most recently indexed block's timestamp.
    If the most recently indexed block (rounded down to the nearest interval) is `interval_seconds`
    ahead of the last trending job run, then the job should re-run.
    The function returns the an int, representing the timestamp, if the jobs should re-run, else None
    """
    with db.scoped_session() as session:
        current_db_block = (
            session.query(Block.number).filter(Block.is_current == True).first()
        )
        current_db_block_number = current_db_block[0]
        current_block = get_adjusted_block(web3, current_db_block_number)
        current_timestamp = current_block["timestamp"]
        current_datetime = datetime.fromtimestamp(current_timestamp)
        min_block_datetime = floor_time(current_datetime, interval_seconds)

        # Handle base case of not having run last trending
        last_trending_datetime = get_last_trending_datetime(redis)
        if not last_trending_datetime:
            # Base case where there is no previous trending calculation in redis
            min_block = find_min_block_above_timestamp(
                current_db_block_number, min_block_datetime, web3
            )
            return min_block, int(min_block_datetime.timestamp())

        # Handle base case of not having run last trending
        duration_since_last_index = current_datetime - last_trending_datetime
        if duration_since_last_index.total_seconds() >= interval_seconds:
            min_block = find_min_block_above_timestamp(
                current_db_block_number, min_block_datetime, web3
            )

            return min_block, int(min_block_datetime.timestamp())
    return None, None


# ####### CELERY TASKS ####### #
@celery.task(name="index_trending", bind=True)
@save_duration_metric(metric_group="celery_task")
def index_trending_task(self):
    """Caches all trending combination of time-range and genre (including no genre)."""
    db = index_trending_task.db
    redis = index_trending_task.redis
    web3 = get_web3()
    have_lock = False
    timeout = 60 * 60 * 2
    update_lock = redis.lock("index_trending_lock", timeout=timeout)
    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            min_block, min_timestamp = get_should_update_trending(
                db, web3, redis, UPDATE_TRENDING_DURATION_DIFF_SEC
            )
            if min_block is not None and min_timestamp is not None:
                index_trending(self, db, redis, min_timestamp)
            else:
                logger.debug("index_trending.py | skip indexing: not min block")
        else:
            logger.debug(
                f"index_trending.py | \
                skip indexing: without lock {have_lock}"
            )
    except Exception as e:
        logger.error("index_trending.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
