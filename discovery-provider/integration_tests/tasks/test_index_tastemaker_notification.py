from datetime import datetime, timedelta

from integration_tests.utils import populate_mock_db
from sqlalchemy import asc
from src.models.notifications.notification import Notification
from src.models.social.repost import Repost
from src.models.social.save import Save
from src.models.tracks.track import Track
from src.models.users.user import User
from src.queries.get_trending_tracks import make_trending_cache_key
from src.tasks.index_trending import index_tastemaker_notifications
from src.trending_strategies.trending_strategy_factory import TrendingStrategyFactory
from src.trending_strategies.trending_type_and_version import TrendingType
from src.utils.config import shared_config
from src.utils.db_session import get_db
from src.utils.redis_cache import set_json_cached_key
from src.utils.redis_connection import get_redis

REDIS_URL = shared_config["redis"]["url"]

BASE_TIME = datetime(2023, 1, 1, 0, 0)


def test_index_tastemaker_notification_no_trending(app):
    pass


def test_index_tastemaker_notification_deleted_reposts(app):
    pass


def test_index_tastemaker_notification(app):
    """
    Test that given when new trending values are calculated
    the correct notifications are generated
    """

    with app.app_context():
        db = get_db()

        # Add some users to the db so we have blocks
        entities = {
            "tracks": [{"track_id": i} for i in range(5)],
            "users": [{"user_id": i} for i in range(10)],
        }
        populate_mock_db(db, entities)

        index_tastemaker_notifications(db, [])
        with db.scoped_session() as session:
            tracks = session.query(Track).all()
            notifications = (
                session.query(Notification).order_by(asc(Notification.specifier)).all()
            )
            users = session.query(User).all()
            reposts = session.query(Repost).all()
            favorites = session.query(Save).all()
            print("tracksss", tracks)
            print("userssss", users)
            print("repostssss", reposts)
            print("favoritessss", favorites)
            print("notificationssss", notifications)
