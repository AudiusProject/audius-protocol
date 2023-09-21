import logging
from typing import List

from sqlalchemy import desc

from src.models.notifications.notification import Notification
from src.models.social.save import SaveType
from src.utils.db_session import get_db
from tests.utils import populate_mock_db

logger = logging.getLogger(__name__)


# ========================================== Start Tests ==========================================
def test_supporter_rank_up_notification(app):
    with app.app_context():
        db = get_db()

    # Insert a supporter rank up and validate that 2 are created for each
    entities = {
        "user_bank_txs": [{"slot": i, "signature": str(i)} for i in range(5)],
    }
    populate_mock_db(db, entities)
    entities = {
        "supporter_rank_ups": [
            {
                "slot": i,
                "rank": i + 1,
                "sender_user_id": 1,
                "receiver_user_id": i + 1,
                "save_type": SaveType.track,
            }
            for i in range(3)
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        supporter_notifications: List[Notification] = (
            session.query(Notification)
            .filter(Notification.type == "supporter_rank_up")
            .order_by(desc(Notification.slot))
            .all()
        )
        supporting_notifications: List[Notification] = (
            session.query(Notification)
            .filter(Notification.type == "supporting_rank_up")
            .order_by(desc(Notification.slot))
            .all()
        )
        assert len(supporter_notifications) == 3
        assert len(supporting_notifications) == 3

        assert supporter_notifications[0].specifier == "3"
        assert supporter_notifications[0].group_id == "supporter_rank_up:3:slot:2"
        assert supporter_notifications[0].type == "supporter_rank_up"
        assert supporter_notifications[0].type_v2 == "supporter_rank_up"
        assert supporter_notifications[0].slot == 2
        assert supporter_notifications[0].blocknumber == None
        assert supporter_notifications[0].data == {
            "rank": 3,
            "sender_user_id": 1,
            "receiver_user_id": 3,
        }
        assert supporter_notifications[0].user_ids == [3]

        assert supporting_notifications[0].specifier == "1"
        assert supporting_notifications[0].group_id == "supporting_rank_up:3:slot:2"
        assert supporting_notifications[0].type == "supporting_rank_up"
        assert supporting_notifications[0].type_v2 == "supporting_rank_up"
        assert supporting_notifications[0].slot == 2
        assert supporting_notifications[0].blocknumber == None
        assert supporting_notifications[0].data == {
            "rank": 3,
            "sender_user_id": 1,
            "receiver_user_id": 3,
        }
        assert supporting_notifications[0].user_ids == [1]
