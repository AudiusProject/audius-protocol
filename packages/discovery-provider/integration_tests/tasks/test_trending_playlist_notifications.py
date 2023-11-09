from datetime import datetime, timedelta

from sqlalchemy import asc

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.models.playlists.playlist import Playlist
from src.queries.get_trending_playlists import make_trending_playlists_cache_key
from src.tasks.cache_trending_playlists import index_trending_playlist_notifications
from src.trending_strategies.trending_strategy_factory import TrendingStrategyFactory
from src.trending_strategies.trending_type_and_version import TrendingType
from src.utils import helpers
from src.utils.config import shared_config
from src.utils.db_session import get_db
from src.utils.redis_cache import set_json_cached_key
from src.utils.redis_connection import get_redis

REDIS_URL = shared_config["redis"]["url"]

BASE_TIME = datetime(2023, 1, 1, 0, 0)


# Simulates a call to cache trending playlists, setting redis with the latest trending_playlists
def cache_trending_playlists_mock(db, playlist_ids: list[int]) -> None:
    redis = get_redis()
    trending_strategy_factory = TrendingStrategyFactory()
    trending_strategy = trending_strategy_factory.get_strategy(TrendingType.PLAYLISTS)
    trending_key = make_trending_playlists_cache_key("week", trending_strategy.version)

    with db.scoped_session() as session:
        trending_playlists = (
            session.query(Playlist).filter(Playlist.playlist_id.in_(playlist_ids)).all()
        )
        trending_playlists = helpers.query_result_to_list(trending_playlists)

        trending_underground_tracks_map = {
            playlist["playlist_id"]: playlist for playlist in trending_playlists
        }

        trending_playlists = [
            trending_underground_tracks_map[playlist_id] for playlist_id in playlist_ids
        ]

        for trending_playlist in trending_playlists:
            trending_playlist["tracks"] = []
        trending_playlists = (trending_playlists, playlist_ids)
        set_json_cached_key(redis, trending_key, trending_playlists)


def test_cache_trending_playlist_notifications(app):
    with app.app_context():
        db = get_db()

    # Add some playlists and users to the db so we have blocks
    entities = {
        "playlists": [
            {
                "playlist_id": i,
                "playlist_owner_id": i % 2 + 1,
            }
            for i in range(100)
        ],
        "users": [{}] * 3,
    }
    populate_mock_db(db, entities)

    # When there are no previous trending-playlist notifications, after
    # indexing playlists, the top 5 should all get notifications

    trending_playlist_ids = list(range(1, 21))
    cache_trending_playlists_mock(db, trending_playlist_ids)

    base_time_int = int(round(BASE_TIME.timestamp()))

    index_trending_playlist_notifications(db, "week", base_time_int)

    with db.scoped_session() as session:
        all_notifications = (
            session.query(Notification).order_by(asc(Notification.specifier)).all()
        )
        assert len(all_notifications) == 5

        new_notification_cases = [
            {"id": 1, "rank": 1},
            {"id": 2, "rank": 2},
            {"id": 3, "rank": 3},
            {"id": 4, "rank": 4},
            {"id": 5, "rank": 5},
        ]
        for i, new_notification_case in enumerate(new_notification_cases):
            notification = all_notifications[i]
            id = new_notification_case["id"]
            rank = new_notification_case["rank"]
            assert notification.specifier == f"{id}"
            assert (
                notification.group_id
                == f"trending_playlist:time_range:week:genre:all:rank:{rank}:playlist_id:{id}:timestamp:1672531200"
            )
            assert notification.type == "trending_playlist"
            assert notification.data == {
                "rank": rank,
                "genre": "all",
                "playlist_id": id,
                "time_range": "week",
            }

    # Test that on second iteration of trending, an hour later, only new notifications appear
    # Prev trending: 1, 2, 3, 4, 5
    # New trending: 2, 4, 5, 1, 7
    # new notifications for playlist_id: 7
    # no new notification for playlist_id: 1, 2, 4, 5, since 1 just went down in ranking, and
    # we just sent out notifications for 2, 4, 5 an hour prior.

    cache_trending_playlists_mock(db, [2, 4, 5, 1, 7, 8, 9, 10])
    updated_time = BASE_TIME + timedelta(hours=1)
    updated_time_int = int(round(updated_time.timestamp()))
    index_trending_playlist_notifications(db, "week", updated_time_int)

    with db.scoped_session() as session:
        all_notifications = (
            session.query(Notification).order_by(asc(Notification.specifier)).all()
        )

        assert len(all_notifications) == 6

        new_notifications = (
            session.query(Notification)
            .filter(Notification.timestamp == updated_time)
            .order_by(asc(Notification.specifier))
            .all()
        )
        assert len(new_notifications) == 1

        new_notification_cases = [
            {"id": 7, "rank": 5},
        ]
        for i, new_notification_case in enumerate(new_notification_cases):
            new_notification = new_notifications[i]
            assert new_notification.data == {
                "rank": new_notification_case["rank"],
                "genre": "all",
                "playlist_id": new_notification_case["id"],
                "time_range": "week",
            }

    # Test that on the third iteration of trending, a day later, we get notifications for
    # the playlists that have moved up the leaderboard
    # Prev trending: 2, 4, 5, 1, 7
    # New trending: 2, 4, 5, 1, 7
    # new notifications for playlist_id: 2, 4, 5
    # no new notification for playlist_id: 1, 7, since 1 still is down in ranking, and we
    # send a notification for 7 23 hours prior

    updated_time = BASE_TIME + timedelta(hours=24)
    updated_time_int = int(round(updated_time.timestamp()))
    index_trending_playlist_notifications(db, "week", updated_time_int)

    with db.scoped_session() as session:
        all_notifications = (
            session.query(Notification).order_by(asc(Notification.specifier)).all()
        )

        assert len(all_notifications) == 9

        new_notifications = (
            session.query(Notification)
            .filter(Notification.timestamp == updated_time)
            .order_by(asc(Notification.specifier))
            .all()
        )

        assert len(new_notifications) == 3

        new_notification_cases = [
            {"id": 2, "rank": 1},
            {"id": 4, "rank": 2},
            {"id": 5, "rank": 3},
        ]
        for i, new_notification_case in enumerate(new_notification_cases):
            new_notification = new_notifications[i]
            assert new_notification.data == {
                "rank": new_notification_case["rank"],
                "genre": "all",
                "playlist_id": new_notification_case["id"],
                "time_range": "week",
            }
