import logging
from typing import List

from sqlalchemy import desc

from src.models.notifications.notification import Notification
from src.utils.db_session import get_db
from tests.utils import populate_mock_db

logger = logging.getLogger(__name__)


# ========================================== Start Tests ==========================================
def test_challenge_disbursement_notification(app):
    """Tests that a save notification is created on save correctly"""
    with app.app_context():
        db = get_db()

    # Insert a challenge disbursement and check that a notificaiton is created
    entities = {
        "reward_manager_txs": [{"slot": i, "signature": str(i)} for i in range(5)],
    }
    populate_mock_db(db, entities)
    entities = {
        "challenge_disbursements": [
            {
                "challenge_id": i,
                "user_id": 1,
            }
            for i in range(3)
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        notifications: List[Notification] = (
            session.query(Notification).order_by(desc(Notification.slot)).all()
        )
        assert len(notifications) == 3

        assert notifications[0].specifier == "1"
        assert notifications[0].group_id == "challenge_reward:1:challenge:2:specifier:2"
        assert notifications[0].type == "challenge_reward"
        assert notifications[0].slot == 2
        assert notifications[0].blocknumber == None
        assert notifications[0].data == {
            "amount": "2",
            "specifier": "2",
            "challenge_id": "2",
        }
        assert notifications[0].user_ids == [1]
