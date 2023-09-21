import logging
from typing import List

from src.models.notifications.notification import Notification
from src.models.users.usdc_purchase import PurchaseType
from src.utils.db_session import get_db
from tests.utils import populate_mock_db

logger = logging.getLogger(__name__)


# ========================================== Start Tests ==========================================
def test_usdc_purchase_notification(app):
    with app.app_context():
        db = get_db()

    entities = {
        "users": [{"user_id": 1}, {"user_id": 2}],
        "tracks": [{"track_id": 100, "owner_id": 2}],
    }
    populate_mock_db(db, entities)
    entities = {
        "usdc_purchases": [
            {
                "slot": 4,
                "buyer_user_id": 1,
                "seller_user_id": 2,
                "amount": 1000,
                "content_type": PurchaseType.track,
                "content_id": 100,
            }
        ]
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        seller_notifications: List[Notification] = (
            session.query(Notification)
            .filter(Notification.type == "usdc_purchase_seller")
            .all()
        )
        buyer_notifications: List[Notification] = (
            session.query(Notification)
            .filter(Notification.type == "usdc_purchase_buyer")
            .all()
        )
        assert len(seller_notifications) == 1
        assert len(buyer_notifications) == 1
        assert seller_notifications[0].user_ids == [2]
        assert seller_notifications[0].specifier == "1"
        assert (
            seller_notifications[0].group_id
            == "usdc_purchase_seller:seller_user_id:2:buyer_user_id:1:content_id:100:content_type:track"
        )
        assert seller_notifications[0].data == {
            "content_type": "track",
            "buyer_user_id": 1,
            "seller_user_id": 2,
            "amount": 1000,
            "content_id": 100,
        }
        assert seller_notifications[0].slot == 4
        assert buyer_notifications[0].user_ids == [1]
        assert buyer_notifications[0].specifier == "1"
        assert (
            buyer_notifications[0].group_id
            == "usdc_purchase_buyer:seller_user_id:2:buyer_user_id:1:content_id:100:content_type:track"
        )
        assert buyer_notifications[0].data == {
            "content_type": "track",
            "buyer_user_id": 1,
            "seller_user_id": 2,
            "amount": 1000,
            "content_id": 100,
        }
        assert buyer_notifications[0].slot == 4
