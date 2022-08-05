import logging
from typing import List

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.models.social.save import SaveType
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


# ========================================== Start Tests ==========================================
def test_save_notification(app):
    """Tests that a save notification is created on save correctly"""
    with app.app_context():
        db = get_db()

    # Insert Save Track and check that a notificaiton is
    entities = {
        "users": [{"user_id": 1}, {"user_id": 2}],
        "tracks": [{"track_id": 100, "owner_id": 2}],
    }
    populate_mock_db(db, entities)
    entities = {
        "saves": [
            {
                "user_id": 1,
                "save_item_id": 100,
                "save_type": SaveType.track,
            }
        ],
    }
    populate_mock_db(db, entities)
    with db.scoped_session() as session:

        notifications: List[Notification] = session.query(Notification).all()
        assert len(notifications) == 1
        notification = notifications[0]
        assert notification.specifier == "save:100:type:track"
        assert notification.notification_group_id == None
        assert notification.type == "save"
        assert notification.slot == None
        assert notification.blocknumber == 2
        logger.info(notification.user_ids)
        logger.info(type(notification.user_ids))
        assert notification.data == {
            "type": "track",
            "user_id": 1,
            "save_item_id": 100,
        }
        assert notification.user_ids == [2]
