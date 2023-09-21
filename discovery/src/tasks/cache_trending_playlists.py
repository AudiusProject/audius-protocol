import logging
import time
from datetime import datetime

from sqlalchemy import bindparam, text

from src.models.notifications.notification import Notification
from src.queries.get_trending_playlists import (
    _get_trending_playlists_with_session,
    make_get_unpopulated_playlists,
    make_trending_cache_key,
)
from src.tasks.celery_app import celery
from src.trending_strategies.trending_strategy_factory import TrendingStrategyFactory
from src.trending_strategies.trending_type_and_version import TrendingType
from src.utils.prometheus_metric import save_duration_metric
from src.utils.redis_cache import set_json_cached_key
from src.utils.redis_constants import trending_playlists_last_completion_redis_key
from src.utils.session_manager import SessionManager

logger = logging.getLogger(__name__)

TIME_RANGES = ["week", "month", "year"]

trending_strategy_factory = TrendingStrategyFactory()


def cache_trending(db, redis, strategy):
    now = int(datetime.now().timestamp())
    with db.scoped_session() as session:
        for time_range in TIME_RANGES:
            key = make_trending_cache_key(time_range, strategy.version)
            res = make_get_unpopulated_playlists(session, time_range, strategy)()
            set_json_cached_key(redis, key, res)
            if time_range == "week":
                index_trending_playlist_notifications(db, time_range, now)


def index_trending_playlist_notifications(
    db: SessionManager, time_range: str, timestamp: int
):
    # Get the top 5 trending tracks from the new trending calculations
    # Get the most recent trending tracks notifications
    # Calculate any diff and write the new notifications if the trending track has moved up in rank
    # Skip if the user was notified of the trending track within the last TRENDING_INTERVAL_HOURS
    # Skip If the new rank is not less than the old rank, skip
    #   ie. Skip if track moved from #2 trending to #3 trending or stayed the same
    trending_strategy_factory = TrendingStrategyFactory()
    # The number of playlists to notify for in the top
    NOTIFICATIONS_PLAYLIST_LIMIT = 5
    current_datetime = datetime.fromtimestamp(timestamp)
    with db.scoped_session() as session:
        top_trending_playlists = _get_trending_playlists_with_session(
            session,
            {
                "time": time_range,
                "offset": 0,
                "limit": NOTIFICATIONS_PLAYLIST_LIMIT,
                "with_tracks": True,
            },
            trending_strategy_factory.get_strategy(TrendingType.PLAYLISTS),
            False,
        )
        top_trending_playlist_ids = [
            str(t["playlist_id"]) for t in top_trending_playlists
        ]

        previous_trending_notifications = (
            session.query(Notification)
            .filter(
                Notification.type == "trending_playlist",
                Notification.specifier.in_(top_trending_playlist_ids),
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
                    specifier in :playlist_ids
                ORDER BY
                    specifier desc,
                    timestamp desc
            """
        )
        latest_notification_query = latest_notification_query.bindparams(
            bindparam("playlist_ids", expanding=True)
        )

        previous_trending_notifications = session.execute(
            latest_notification_query,
            {"playlist_ids": top_trending_playlist_ids, "type": "trending_playlist"},
        )
        previous_trending = {
            n[0]: {"timestamp": n[1], **n[2]} for n in previous_trending_notifications
        }

        notifications = []

        # Do not send notifications for the same track trending within 24 hours
        NOTIFICATION_INTERVAL_SEC = 60 * 60 * 24

        for index, playlist in enumerate(top_trending_playlists):
            playlist_id = playlist["playlist_id"]
            rank = index + 1
            previous_playlist_notification = previous_trending.get(str(playlist_id))

            if previous_playlist_notification is not None:
                prev_notification_datetime = datetime.fromtimestamp(
                    previous_playlist_notification["timestamp"].timestamp()
                )
                if (
                    current_datetime - prev_notification_datetime
                ).total_seconds() < NOTIFICATION_INTERVAL_SEC:
                    continue
                prev_rank = previous_playlist_notification["rank"]
                if prev_rank <= rank:
                    continue

            notifications.append(
                {
                    "playlist_owner_id": playlist["playlist_owner_id"],
                    "group_id": f"trending_playlist:time_range:week:genre:all:rank:{rank}:playlist_id:{playlist_id}:timestamp:{timestamp}",
                    "playlist_id": playlist_id,
                    "rank": rank,
                }
            )

        session.bulk_save_objects(
            [
                Notification(
                    user_ids=[n["playlist_owner_id"]],
                    timestamp=current_datetime,
                    type="trending_playlist",
                    group_id=n["group_id"],
                    specifier=n["playlist_id"],
                    data={
                        "time_range": "week",
                        "genre": "all",
                        "rank": n["rank"],
                        "playlist_id": n["playlist_id"],
                    },
                )
                for n in notifications
            ]
        )

        logger.info(
            "index_trending.py | Created trending playlist notifications",
            extra={
                "job": "cache_trending_playlists",
                "subtask": "trending playlist notification",
            },
        )


@celery.task(name="cache_trending_playlists", bind=True)
@save_duration_metric(metric_group="celery_task")
def cache_trending_playlists(self):
    """Caches trending playlists for time period"""

    db = cache_trending_playlists.db_read_replica
    redis = cache_trending_playlists.redis

    have_lock = False
    update_lock = redis.lock("cache_trending_playlists_lock", timeout=7200)

    try:
        have_lock = update_lock.acquire(blocking=False)

        if have_lock:
            trending_playlist_versions = (
                trending_strategy_factory.get_versions_for_type(
                    TrendingType.PLAYLISTS
                ).keys()
            )
            for version in trending_playlist_versions:
                logger.info(
                    f"cache_trending_playlists.py ({version.name} version) | Starting"
                )
                strategy = trending_strategy_factory.get_strategy(
                    TrendingType.PLAYLISTS, version
                )
                start_time = time.time()
                cache_trending(db, redis, strategy)
                end_time = time.time()
                logger.info(
                    f"cache_trending_playlists.py ({version.name} version) | \
                    Finished in {end_time - start_time} seconds"
                )
                redis.set(trending_playlists_last_completion_redis_key, int(end_time))
        else:
            logger.info("cache_trending_playlists.py | Failed to acquire lock")
    except Exception as e:
        logger.error(
            "cache_trending_playlists.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
