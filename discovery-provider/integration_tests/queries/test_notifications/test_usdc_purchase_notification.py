import logging
from datetime import datetime, timedelta

from integration_tests.utils import populate_mock_db
from src.api.v1.utils.extend_notification import extend_notification
from src.models.users.usdc_purchase import PurchaseType
from src.queries.get_notifications import NotificationType, get_notifications
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)

t1 = datetime(2020, 10, 10, 10, 35, 0)
t2 = t1 - timedelta(hours=1)
t3 = t1 - timedelta(hours=2)
t4 = t1 - timedelta(hours=3)


def test_get_repost_notifications(app):
    with app.app_context():
        db_mock = get_db()

        test_entities = {
            "users": [{"user_id": i + 1} for i in range(4)],
            "tracks": [{"track_id": 1, "owner_id": 1}],
        }
        populate_mock_db(db_mock, test_entities)

        test_actions = {
            "usdc_purchases": [
                {
                    "slot": 4,
                    "buyer_user_id": 2,
                    "seller_user_id": 1,
                    "amount": 1000000,
                    "content_type": PurchaseType.track,
                    "content_id": 1,
                }
            ]
        }
        populate_mock_db(db_mock, test_actions)

        with db_mock.scoped_session() as session:
            args = {
                "limit": 10,
                "user_id": 1,
                "valid_types": [NotificationType.USDC_PURCHASE_SELLER],
            }
            u1_seller_notifications = get_notifications(session, args)
            assert len(u1_seller_notifications) == 1
            assert (
                u1_seller_notifications[0]["group_id"]
                == "usdc_purchase_seller:seller_user_id:1:buyer_user_id:2:content_id:1:content_type:track"
            )
            assert u1_seller_notifications[0]["is_seen"] == False
            assert len(u1_seller_notifications[0]["actions"]) == 1
            assert u1_seller_notifications[0]["actions"][0]["data"] == {
                "content_type": "track",
                "buyer_user_id": 2,
                "seller_user_id": 1,
                "amount": 1000000,
                "extra_amount": 0,
                "content_id": 1,
            }

            args = {
                "limit": 10,
                "user_id": 2,
                "valid_types": [NotificationType.USDC_PURCHASE_BUYER],
            }
            u2_buyer_notifications = get_notifications(session, args)
            assert len(u2_buyer_notifications) == 1
            assert (
                u2_buyer_notifications[0]["group_id"]
                == "usdc_purchase_buyer:seller_user_id:1:buyer_user_id:2:content_id:1:content_type:track"
            )
            assert u2_buyer_notifications[0]["is_seen"] == False
            assert len(u2_buyer_notifications[0]["actions"]) == 1
            assert u2_buyer_notifications[0]["actions"][0]["data"] == {
                "content_type": "track",
                "buyer_user_id": 2,
                "seller_user_id": 1,
                "amount": 1000000,
                "content_id": 1,
            }


def test_extended_usdc_purchase_notification(app):
    with app.app_context():
        db_mock = get_db()

        test_entities = {
            "users": [{"user_id": i + 1} for i in range(4)],
            "tracks": [{"track_id": 1, "owner_id": 1}],
        }
        populate_mock_db(db_mock, test_entities)

        test_actions = {
            "usdc_purchases": [
                {
                    "slot": 4,
                    "buyer_user_id": 2,
                    "seller_user_id": 1,
                    "amount": 1000000,
                    "content_type": PurchaseType.track,
                    "content_id": 1,
                }
            ]
        }
        populate_mock_db(db_mock, test_actions)

        with db_mock.scoped_session() as session:
            args = {
                "limit": 10,
                "user_id": 1,
                "valid_types": [NotificationType.USDC_PURCHASE_SELLER],
            }
            u1_seller_notifications = get_notifications(session, args)
            extended_buyer_notif = extend_notification(u1_seller_notifications[0])
            assert extended_buyer_notif["type"] == "usdc_purchase_seller"
            assert (
                extended_buyer_notif["group_id"]
                == "usdc_purchase_seller:seller_user_id:1:buyer_user_id:2:content_id:1:content_type:track"
            )
            assert extended_buyer_notif["actions"][0]["specifier"] == "ML51L"
            assert extended_buyer_notif["actions"][0]["type"] == "usdc_purchase_seller"
            assert extended_buyer_notif["actions"][0]["data"] == {
                "content_type": "track",
                "buyer_user_id": "ML51L",
                "seller_user_id": "7eP5n",
                "amount": "1000000",
                "content_id": "7eP5n",
            }

            args = {
                "limit": 10,
                "user_id": 2,
                "valid_types": [NotificationType.USDC_PURCHASE_BUYER],
            }
            u2_buyer_notifications = get_notifications(session, args)
            extended_buyer_notif = extend_notification(u2_buyer_notifications[0])
            assert extended_buyer_notif["type"] == "usdc_purchase_buyer"
            assert (
                extended_buyer_notif["group_id"]
                == "usdc_purchase_buyer:seller_user_id:1:buyer_user_id:2:content_id:1:content_type:track"
            )
            assert extended_buyer_notif["actions"][0]["specifier"] == "ML51L"
            assert extended_buyer_notif["actions"][0]["type"] == "usdc_purchase_buyer"
            assert extended_buyer_notif["actions"][0]["data"] == {
                "content_type": "track",
                "buyer_user_id": "ML51L",
                "seller_user_id": "7eP5n",
                "amount": "1000000",
                "content_id": "7eP5n",
            }
