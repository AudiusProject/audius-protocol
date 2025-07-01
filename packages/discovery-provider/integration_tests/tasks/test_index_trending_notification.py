from datetime import datetime, timedelta

from sqlalchemy import asc, delete

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.models.tracks.track_trending_score import TrackTrendingScore
from src.tasks.index_trending import (
    get_top_trending_to_notify,
    index_trending_notifications,
)
from src.trending_strategies.trending_type_and_version import (
    TrendingType,
    TrendingVersion,
)
from src.utils.db_session import get_db

BASE_TIME = datetime(2023, 1, 1, 0, 0)


def test_index_trending_notification(app):
    """
    Test that given when new trending values are calculated
    the correct notifications are generated
    """

    with app.app_context():
        db = get_db()
        # Test that if there are no prev notifications, all trending in top are generated

        # Add tracks, scores, users
        entities = {
            "tracks": [{"track_id": i, "owner_id": i % 2 + 1} for i in range(1, 21)],
            "track_trending_scores": [
                {
                    "track_id": i,
                    "score": 100 - i,
                    "version": TrendingVersion.AnlGe.value,
                    "time_range": "week",
                    "type": TrendingType.TRACKS.name,
                }
                for i in range(1, 21)
            ],
            "users": [{"user_id": i} for i in range(1, 3)],
        }

        populate_mock_db(db, entities)
        base_time_int = int(round(BASE_TIME.timestamp()))

        top_trending = get_top_trending_to_notify(db)
        index_trending_notifications(db, base_time_int, top_trending)
        with db.scoped_session() as session:
            notifications = (
                session.query(Notification).order_by(asc(Notification.specifier)).all()
            )
            assert len(notifications) == 5

            notification_0 = notifications[0]
            assert notification_0.specifier == "1"
            assert (
                notification_0.group_id
                == "trending:time_range:week:genre:all:rank:1:track_id:1:timestamp:1672531200"
            )
            assert notification_0.type == "trending"
            assert notification_0.data == {
                "rank": 1,
                "genre": "all",
                "track_id": 1,
                "time_range": "week",
            }
            assert notification_0.user_ids == [2]

            notification_1 = notifications[1]
            assert notification_1.specifier == "2"
            assert (
                notification_1.group_id
                == "trending:time_range:week:genre:all:rank:2:track_id:2:timestamp:1672531200"
            )
            assert notification_1.type == "trending"
            assert notification_1.data == {
                "rank": 2,
                "genre": "all",
                "track_id": 2,
                "time_range": "week",
            }
            assert notification_1.user_ids == [1]

        # Test that on second iteration of trending, only new notifications appear
        # Prev: 1, 2, 3, 4, 5
        # New: 2, 4, 5, 1, 7
        # new notifications for track_id: 2, 4, 5, 7
        # no new notification for track_id: 1

        with db.scoped_session() as session:
            session.execute(delete(TrackTrendingScore))
            session.commit()

        entities = {
            "track_trending_scores": [
                {
                    "track_id": track_id,
                    "score": 100 - i,
                    "version": TrendingVersion.AnlGe.value,
                    "time_range": "week",
                    "type": TrendingType.TRACKS.name,
                }
                for (i, track_id) in enumerate([2, 4, 5, 1, 7, 8, 9, 10])
            ]
        }
        print(entities)
        populate_mock_db(db, entities)

        updated_time = BASE_TIME + timedelta(hours=1)
        updated_time_int = int(round(updated_time.timestamp()))

        top_trending = get_top_trending_to_notify(db)
        index_trending_notifications(db, updated_time_int, top_trending)
        with db.scoped_session() as session:
            all_notifications = session.query(Notification).all()
            assert len(all_notifications) == 6

            updated_notifications = (
                session.query(Notification)
                .filter(Notification.timestamp == updated_time)
                .order_by(asc(Notification.specifier))
                .all()
            )
            assert len(updated_notifications) == 1

            assert updated_notifications[0].data == {
                "rank": 5,
                "genre": "all",
                "track_id": 7,
                "time_range": "week",
            }

        updated_time = BASE_TIME + timedelta(hours=24)
        updated_time_int = int(round(updated_time.timestamp()))

        top_trending = get_top_trending_to_notify(db)
        index_trending_notifications(db, updated_time_int, top_trending)
        with db.scoped_session() as session:
            all_notifications = session.query(Notification).all()
            assert len(all_notifications) == 9

            updated_notifications = (
                session.query(Notification)
                .filter(Notification.timestamp == updated_time)
                .order_by(asc(Notification.specifier))
                .all()
            )
            assert len(updated_notifications) == 3

            assert updated_notifications[0].data == {
                "rank": 1,
                "genre": "all",
                "track_id": 2,
                "time_range": "week",
            }

            assert updated_notifications[1].data == {
                "rank": 2,
                "genre": "all",
                "track_id": 4,
                "time_range": "week",
            }

            assert updated_notifications[2].data == {
                "rank": 3,
                "genre": "all",
                "track_id": 5,
                "time_range": "week",
            }
