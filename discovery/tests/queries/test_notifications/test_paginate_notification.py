import logging
from datetime import datetime, timedelta

from src.queries.get_notifications import get_notifications
from src.utils.db_session import get_db
from tests.utils import populate_mock_db

t1 = datetime(2020, 10, 10, 10, 35, 0)
times = [t1 - timedelta(hours=i) for i in range(200)]

logger = logging.getLogger(__name__)


def test_get_notifications(app):
    with app.app_context():
        db_mock = get_db()

        test_entities = {
            "users": [{"user_id": i + 1} for i in range(200)],
            "tracks": [{"track_id": i, "owner_id": 1} for i in range(60)],
            "notification_seens": [
                {"user_id": 1, "seen_at": times[i]} for i in range(0, 100, 3)
            ],
        }

        populate_mock_db(db_mock, test_entities)
        test_actions = {
            "follows": [
                {
                    "follower_user_id": i + 2,
                    "followee_user_id": 1,
                    "created_at": times[i],
                }
                for i in range(0, 80, 3)
            ],
            "saves": [
                {
                    "user_id": i,
                    "save_item_id": 1,
                    "save_type": "track",
                    "created_at": times[i],
                }
                for i in range(0, 60, 2)
            ],
        }
        populate_mock_db(db_mock, test_actions)

        with db_mock.scoped_session() as session:
            args = {"limit": 10, "user_id": 1}
            u1_notification_1 = get_notifications(session, args)
            assert len(u1_notification_1) == 10
            sec_last_notification = u1_notification_1[8]
            timestamp = sec_last_notification["seen_at"]
            group_id_offset = sec_last_notification["group_id"]
            args_2 = {
                "limit": 4,
                "user_id": 1,
                "group_id": group_id_offset,
                "timestamp": timestamp,
            }
            u1_notification_2 = get_notifications(session, args_2)
            logger.info(u1_notification_2)
            logger.info(u1_notification_1)
            assert len(u1_notification_2) == 4
            assert u1_notification_2[0] == u1_notification_1[9]
