from datetime import datetime, timedelta

from integration_tests.utils import populate_mock_db
from src.queries.get_notifications import get_notifications
from src.utils.db_session import get_db

t1 = datetime(2020, 10, 10, 10, 35, 0)
t2 = t1 - timedelta(hours=1)
t3 = t1 - timedelta(hours=2)
t4 = t1 - timedelta(hours=3)


def test_get_save_notifications(app):
    with app.app_context():
        db_mock = get_db()

        test_entities = {
            "user_balance_changes": [
                {
                    "user_id": 1,
                    "blocknumber": 10,
                    # No tier change, none -> none
                    "previous_balance": 0,
                    "current_balance": 20000000000000000000,
                },
            ],
            "users": [{"user_id": i + 1} for i in range(2)],
        }
        populate_mock_db(db_mock, test_entities)

        with db_mock.scoped_session() as session:
            args = {"limit": 10, "user_id": 1}
            u1_notifications = get_notifications(session, args)
            assert len(u1_notifications) == 1
            assert (
                u1_notifications[0]["group_id"]
                == "tier_change:user_id:1:tier:bronze:blocknumber:10"
            )
            assert u1_notifications[0]["is_seen"] == False
            assert len(u1_notifications[0]["actions"]) == 1
            u1_notifications[0]["actions"][0]["data"] = {
                "new_tier": "bronze",
                "new_tier_value": 10,
                "current_value": "20000000000000000000",
            }
