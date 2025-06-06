from datetime import datetime, timedelta

from sqlalchemy import asc, delete

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.models.playlists.playlist_trending_score import PlaylistTrendingScore
from src.tasks.index_trending import index_trending_playlist_notifications
from src.trending_strategies.trending_type_and_version import (
    TrendingType,
    TrendingVersion,
)
from src.utils.db_session import get_db

BASE_TIME = datetime(2023, 1, 1, 0, 0)


def test_cache_trending_playlist_notifications(app):
    with app.app_context():
        db = get_db()

        # Add some playlists and users to the db so we have blocks
        # Note: Playlists must have > 3 tracks with > 3 unique owners to
        # not be excluded, so the fixtures below are set up with that in mind.
        entities = {
            "tracks": [{"track_id": i, "owner_id": i % 4 + 1} for i in range(1, 21)],
            "playlists": [
                {
                    "playlist_id": i,
                    "playlist_owner_id": i % 2 + 1,
                    "playlist_contents": {
                        "track_ids": [
                            {"time": 1, "track": 1},
                            {"time": 2, "track": 2},
                            {"time": 3, "track": 3},
                            {"time": 4, "track": 4},
                        ]
                    },
                }
                for i in range(1, 21)
            ],
            "playlist_trending_scores": [
                {
                    "playlist_id": i,
                    "score": 100 - i,
                    "version": TrendingVersion.pnagD.value,
                    "time_range": "week",
                    "type": TrendingType.PLAYLISTS.name,
                }
                for i in range(1, 21)
            ],
            "users": [{"user_id": i} for i in range(1, 5)],
        }
        populate_mock_db(db, entities)

        # When there are no previous trending-playlist notifications, after
        # indexing playlists, the top 5 should all get notifications

        base_time_int = int(round(BASE_TIME.timestamp()))

        index_trending_playlist_notifications(db, base_time_int)

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

        with db.scoped_session() as session:
            session.execute(delete(PlaylistTrendingScore))
            session.commit()

        entities = {
            "playlist_trending_scores": [
                {
                    "playlist_id": playlist_id,
                    "score": 100 - i,
                    "version": TrendingVersion.pnagD.value,
                    "time_range": "week",
                    "type": TrendingType.PLAYLISTS.name,
                }
                for (i, playlist_id) in enumerate([2, 4, 5, 1, 7, 8, 9, 10])
            ]
        }
        populate_mock_db(db, entities)

        updated_time = BASE_TIME + timedelta(hours=1)
        updated_time_int = int(round(updated_time.timestamp()))

        index_trending_playlist_notifications(db, updated_time_int)

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
        index_trending_playlist_notifications(db, updated_time_int)

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
