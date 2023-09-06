import logging
from typing import List

from sqlalchemy import asc, desc

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


# ========================================== Start Tests ==========================================
def test_repost_notification(app):
    """Tests that a repost notification is created on repost  correctly"""
    with app.app_context():
        db = get_db()

    # Insert a follow and check that a notificaiton is created for the followee
    entities = {
        "users": [{"user_id": i + 1} for i in range(50)],
        "follows": [
            {"follower_user_id": i + 2, "followee_user_id": i + 1} for i in range(4)
        ]
        + [{"follower_user_id": i + 4, "followee_user_id": 1} for i in range(25)],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        notifications: List[Notification] = (
            session.query(Notification)
            .filter(Notification.type == "follow")
            .order_by(asc(Notification.blocknumber))
            .all()
        )
        assert len(notifications) == 29
        assert notifications[0].group_id == "follow:1"
        assert notifications[0].specifier == "2"
        assert notifications[1].group_id == "follow:2"
        assert notifications[1].specifier == "3"
        assert notifications[2].group_id == "follow:3"
        assert notifications[2].specifier == "4"
        assert notifications[3].group_id == "follow:4"
        assert notifications[3].specifier == "5"
        assert notifications[0].type == "follow"
        assert notifications[0].slot == None
        assert notifications[0].blocknumber == 0
        assert notifications[0].data == {"followee_user_id": 1, "follower_user_id": 2}
        assert notifications[0].user_ids == [1]

        milstone_notifications: List[Notification] = (
            session.query(Notification)
            .filter(Notification.type == "milestone_follower_count")
            .order_by(desc(Notification.group_id))
            .all()
        )

        assert len(milstone_notifications) == 2
        assert (
            milstone_notifications[0].group_id
            == "milestone:FOLLOWER_COUNT:id:1:threshold:25"
        )
        assert milstone_notifications[0].specifier == "1"
        assert milstone_notifications[0].type == "milestone_follower_count"
        assert milstone_notifications[0].data == {
            "type": "FOLLOWER_COUNT",
            "user_id": 1,
            "threshold": 25,
        }
        assert milstone_notifications[0].user_ids == [1]
