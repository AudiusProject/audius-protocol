import logging
import time
from datetime import datetime

from redis import Redis
from sqlalchemy import bindparam, text
from src.models.notifications.notification import Notification
from src.queries.get_underground_trending import (
    _get_underground_trending_with_session,
    make_get_unpopulated_tracks,
    make_underground_trending_cache_key,
)
from src.trending_strategies.trending_strategy_factory import TrendingStrategyFactory
from src.trending_strategies.trending_type_and_version import TrendingType
from src.utils.redis_cache import set_json_cached_key
from src.utils.session_manager import SessionManager

logger = logging.getLogger(__name__)
trending_strategy_factory = TrendingStrategyFactory()


def index_trending_underground(db: SessionManager, redis: Redis, timestamp: int):
    with db.scoped_session() as session:
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
    index_trending_underground_notifications(db, time, timestamp)


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
        logger.info(
            "index_trending.py | Created underground-trending notifications",
            extra={"job": "index_trending", "subtask": "trending notification"},
        )
