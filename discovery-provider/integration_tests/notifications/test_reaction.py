import logging
from datetime import datetime
from typing import List

from integration_tests.utils import populate_mock_db
from sqlalchemy import asc
from src.models.notifications.notification import Notification
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


# ========================================== Start Tests ==========================================
def test_reaction_notification(app):
    with app.app_context():
        db = get_db()

    now = datetime.now()
    # Insert a reaction and check that a notificaiton is created
    entities = {
        "users": [{"user_id": i + 1, "wallet": "0x" + str(i)} for i in range(3)],
    }
    populate_mock_db(db, entities)
    entities = {
        "reactions": [
            {
                "id": i + 1,
                "sender_wallet": "0x" + str(i),
                "reacted_to": "react_" + str(i),
                "timestamp": now,
            }
            for i in range(3)
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:

        notifications: List[Notification] = (
            session.query(Notification).order_by(asc(Notification.slot)).all()
        )
        assert len(notifications) == 3
        assert notifications[0].specifier == "1"
        assert notifications[
            0
        ].group_id == "reaction:reaction_to:react_0:reaction_type:type:reaction_value:1:timestamp:" + now.strftime(
            "%Y-%m-%d %H:%M:%S.%f"
        ).rstrip(
            "0"
        )
        assert notifications[1].specifier == "2"
        assert notifications[
            1
        ].group_id == "reaction:reaction_to:react_1:reaction_type:type:reaction_value:1:timestamp:" + now.strftime(
            "%Y-%m-%d %H:%M:%S.%f"
        ).rstrip(
            "0"
        )
        assert notifications[2].specifier == "3"
        assert notifications[
            2
        ].group_id == "reaction:reaction_to:react_2:reaction_type:type:reaction_value:1:timestamp:" + now.strftime(
            "%Y-%m-%d %H:%M:%S.%f"
        ).rstrip(
            "0"
        )
        assert notifications[0].notification_group_id == None
        assert notifications[0].type == "reaction"
        assert notifications[0].slot == 0
        assert notifications[0].blocknumber == None
        assert notifications[0].data == {
            "reacted_to": "react_0",
            "reaction_type": "type",
            "sender_wallet": "0x0",
            "reaction_value": 1,
        }
        assert notifications[0].user_ids == [1]
