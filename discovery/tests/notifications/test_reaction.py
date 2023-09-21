import logging
from datetime import datetime
from typing import List

from sqlalchemy import asc

from src.models.notifications.notification import Notification
from src.utils.db_session import get_db
from tests.utils import populate_mock_db

logger = logging.getLogger(__name__)


# ========================================== Start Tests ==========================================
def test_reaction_notification(app):
    with app.app_context():
        db = get_db()

    now = datetime.now()
    # Insert a reaction and check that a notificaiton is created
    entities = {
        "users": [{"user_id": i + 1, "wallet": "0x" + str(i)} for i in range(4)],
    }
    populate_mock_db(db, entities)

    entities = {
        "user_tips": [
            {
                "sender_user_id": i + 1,
                "receiver_user_id": i + 2,
                "signature": f"sig_{i}",
                "amount": (i + 1) * 100000000,
            }
            for i in range(3)
        ],
    }
    populate_mock_db(db, entities)

    entities = {
        "reactions": [
            {
                "id": i + 1,
                "sender_wallet": f"0x{i}",
                "reacted_to": f"sig_{i}",
                "timestamp": now,
                "reaction_type": "tip",
                "reaction_value": i,
                "tx_signature": f"tx_sig_{i}",
            }
            for i in range(3)
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        notifications: List[Notification] = (
            session.query(Notification)
            .filter(Notification.type == "reaction")
            .order_by(asc(Notification.slot))
            .all()
        )

        assert len(notifications) == 2
        assert notifications[0].specifier == "3"
        assert (
            notifications[0].group_id
            == "reaction:reaction_to:sig_1:reaction_type:tip:reaction_value:1"
        )
        assert notifications[1].specifier == "4"
        assert (
            notifications[1].group_id
            == "reaction:reaction_to:sig_2:reaction_type:tip:reaction_value:2"
        )
        assert notifications[0].type == "reaction"
        assert notifications[0].slot == 1
        assert notifications[0].blocknumber == None
        assert notifications[0].data == {
            "reacted_to": "sig_1",
            "reaction_type": "tip",
            "sender_wallet": "0x1",
            "reaction_value": 1,
            "receiver_user_id": 3,
            "sender_user_id": 2,
            "tip_amount": "200000000",
        }
        assert notifications[0].user_ids == [2]

        assert notifications[1].type == "reaction"
        assert notifications[1].slot == 2
        assert notifications[1].blocknumber == None
        assert notifications[1].data == {
            "reacted_to": "sig_2",
            "reaction_type": "tip",
            "sender_wallet": "0x2",
            "reaction_value": 2,
            "receiver_user_id": 4,
            "sender_user_id": 3,
            "tip_amount": "300000000",
        }
        assert notifications[1].user_ids == [3]

        notifications: List[Notification] = (
            session.query(Notification)
            .filter(Notification.type == "tip_receive")
            .order_by(asc(Notification.slot))
            .all()
        )
        assert len(notifications) == 3
        assert notifications[0].data == {
            "reaction_value": 0,
            "receiver_user_id": 2,
            "sender_user_id": 1,
            "amount": 100000000,
            "tx_signature": "sig_0",
        }
