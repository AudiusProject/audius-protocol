import logging
from typing import List

from sqlalchemy import asc

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


# ========================================== Start Tests ==========================================
def test_tier_change(app):
    with app.app_context():
        db = get_db()

    entities = {
        "user_balance_changes": [
            {
                "user_id": 1,
                "blocknumber": 10,
                # No tier change, none -> none
                "previous_balance": 0,
                "current_balance": 6 * 1000000000000000000,
            },
            {
                "user_id": 2,
                "blocknumber": 11,
                # Tier change, none -> bronze
                "previous_balance": 0,
                "current_balance": 10 * 1000000000000000000,
            },
            {
                "user_id": 3,
                "blocknumber": 12,
                # Tier change, none -> bronze
                "previous_balance": 0,
                "current_balance": 15 * 1000000000000000000,
            },
            {
                "user_id": 4,
                "blocknumber": 13,
                # Tier change, none -> platinum
                "previous_balance": 0,
                "current_balance": 20000 * 1000000000000000000,
            },
            {
                "user_id": 5,
                "blocknumber": 14,
                # No tier change, gold -> gold
                "previous_balance": 1200 * 1000000000000000000,
                "current_balance": 9000 * 1000000000000000000,
            },
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        notifications: List[Notification] = (
            session.query(Notification).order_by(asc(Notification.blocknumber)).all()
        )
        assert len(notifications) == 3
        assert notifications[0].user_ids == [2]
        assert notifications[0].specifier == "2"
        assert (
            notifications[0].group_id
            == "tier_change:user_id:2:tier:bronze:blocknumber:11"
        )
        assert notifications[0].data == {
            "new_tier": "bronze",
            "new_tier_value": 10,
            "current_value": "10000000000000000000",
        }

        assert notifications[1].user_ids == [3]
        assert (
            notifications[1].group_id
            == "tier_change:user_id:3:tier:bronze:blocknumber:12"
        )
        assert notifications[1].data == {
            "new_tier": "bronze",
            "new_tier_value": 10,
            "current_value": "15000000000000000000",
        }

        assert notifications[2].user_ids == [4]
        assert notifications[2].specifier == "4"
        assert (
            notifications[2].group_id
            == "tier_change:user_id:4:tier:platinum:blocknumber:13"
        )
        assert notifications[2].data == {
            "new_tier": "platinum",
            "new_tier_value": 10000,
            "current_value": "20000000000000000000000",
        }

        session.execute(
            """
            update user_balance_changes
            set 
              previous_balance = 10000000000000000000,
              current_balance = 9999999000000000000000000,
              blocknumber=20
            where user_id = 2;
            """
        )

        notifications: List[Notification] = (
            session.query(Notification)
            .filter(Notification.blocknumber > 19)
            .order_by(asc(Notification.blocknumber))
            .all()
        )
        assert len(notifications) == 1
        assert notifications[0].user_ids == [2]
        assert notifications[0].specifier == "2"
        assert (
            notifications[0].group_id
            == "tier_change:user_id:2:tier:platinum:blocknumber:20"
        )
        assert notifications[0].data == {
            "new_tier": "platinum",
            "new_tier_value": 100000,
            "current_value": "9999999000000000000000000",
        }

        session.execute(
            """
            update user_balance_changes
            set 
              previous_balance = 9999999000000000000000000,
              current_balance = 10000000000000000000000,
              blocknumber=22
            where user_id = 2;
            """
        )

        notifications: List[Notification] = (
            session.query(Notification)
            .filter(Notification.blocknumber > 20)
            .order_by(asc(Notification.blocknumber))
            .all()
        )
        assert len(notifications) == 0
