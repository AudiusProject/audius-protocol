import logging
from typing import List

from sqlalchemy import desc

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


# ========================================== Start Tests ==========================================
def test_supporter_rank_up_notification(app):
    with app.app_context():
        db = get_db()

    entities = {
        "user_tips": [
            {
                "sender_user_id": 1,
                "receiver_user_id": i + 1,
                "amount": (i + 1) * 100000000,
            }
            for i in range(3)
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        send_notifications: List[Notification] = (
            session.query(Notification)
            .filter(Notification.type == "tip_send")
            .order_by(desc(Notification.slot))
            .all()
        )
        receive_notifications: List[Notification] = (
            session.query(Notification)
            .filter(Notification.type == "tip_receive")
            .order_by(desc(Notification.slot))
            .all()
        )
        assert len(send_notifications) == 3
        assert len(receive_notifications) == 3

        assert send_notifications[0].specifier == "1"
        assert send_notifications[0].group_id == "tip_send:user_id:1:signature:2"
        assert send_notifications[0].type == "tip_send"
        assert send_notifications[0].slot == 2
        assert send_notifications[0].blocknumber == None
        assert send_notifications[0].data == {
            "amount": 300000000,
            "sender_user_id": 1,
            "receiver_user_id": 3,
            "tx_signature": "2",
        }
        assert send_notifications[0].user_ids == [1]

        assert receive_notifications[0].specifier == "3"
        assert receive_notifications[0].group_id == "tip_receive:user_id:3:signature:2"
        assert receive_notifications[0].type == "tip_receive"
        assert receive_notifications[0].slot == 2
        assert receive_notifications[0].blocknumber == None
        assert receive_notifications[0].data == {
            "amount": 300000000,
            "sender_user_id": 1,
            "receiver_user_id": 3,
            "tx_signature": "2",
        }
        assert receive_notifications[0].user_ids == [3]
