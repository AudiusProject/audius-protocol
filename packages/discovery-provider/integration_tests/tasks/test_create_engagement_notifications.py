import logging  # pylint: disable=C0302
from datetime import datetime

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.tasks.create_engagement_notifications import (
    CLAIMABLE_REWARD,
    _create_engagement_notifications,
    get_claimable_reward_notification_group_id,
)
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)

TEST_USER_ID = 1
TEST_SPECIFIER = "1=>2"
TEST_CHALLENGE_ID = "b"
TEST_AMOUNT = 1
TEST_GROUP_ID = get_claimable_reward_notification_group_id(
    TEST_USER_ID, TEST_CHALLENGE_ID, TEST_SPECIFIER
)


def test_create_challenge_claimable_notif(app):
    with app.app_context():
        db = get_db()

    entities = {
        "user_challenges": [
            {  # claimable not ready
                "challenge_id": "s",
                "specifier": TEST_SPECIFIER,
                "amount": TEST_AMOUNT,
                "is_complete": True,
                "user_id": TEST_USER_ID,
            },
            {
                "completed_at": datetime(2024, 6, 7),
                "challenge_id": TEST_CHALLENGE_ID,
                "specifier": TEST_SPECIFIER,
                "amount": TEST_AMOUNT,
                "is_complete": True,
                "user_id": TEST_USER_ID,
            },
        ],
    }

    populate_mock_db(db, entities)
    with db.scoped_session() as session:
        _create_engagement_notifications(session)
        all_notifications = session.query(Notification).all()

        assert len(all_notifications) == 1
        notification = all_notifications[0]
        assert notification.specifier == TEST_SPECIFIER
        assert notification.group_id == TEST_GROUP_ID
        assert notification.data == {
            "specifier": TEST_SPECIFIER,
            "challenge_id": TEST_CHALLENGE_ID,
            "amount": TEST_AMOUNT,
        }
        assert notification.type == CLAIMABLE_REWARD
        assert notification.user_ids == [TEST_USER_ID]


def test_debounce_claimable_reward_notif(app):
    with app.app_context():
        db = get_db()

    entities = {
        "user_challenges": [
            {  # claimable not ready
                "challenge_id": "s",
                "specifier": TEST_SPECIFIER,
                "amount": TEST_AMOUNT,
                "is_complete": True,
                "user_id": TEST_USER_ID,
            },
            {
                "completed_at": datetime(2024, 6, 7),
                "challenge_id": TEST_CHALLENGE_ID,
                "specifier": TEST_SPECIFIER,
                "amount": TEST_AMOUNT,
                "is_complete": True,
                "user_id": TEST_USER_ID,
            },
        ],
        "notification": [
            {
                "user_ids": [TEST_USER_ID],
                "type": CLAIMABLE_REWARD,
                "timestamp": datetime(2024, 6, 6, 23),
            }
        ],
    }

    populate_mock_db(db, entities)
    with db.scoped_session() as session:
        all_notifications = session.query(Notification).all()
        logger.info(f"asdf populated notifications: {all_notifications}")

    with db.scoped_session() as session:
        _create_engagement_notifications(session)
        all_notifications = session.query(Notification).all()

        assert len(all_notifications) == 1
        notification = all_notifications[0]
        assert notification.specifier == "0"
        assert notification.group_id == "default_group_id"
        assert notification.type == CLAIMABLE_REWARD
        assert notification.user_ids == [TEST_USER_ID]


def test_ignore_existing_claimable_notification(app):
    with app.app_context():
        db = get_db()

    entities = {
        "user_challenges": [
            {
                "challenge_id": TEST_CHALLENGE_ID,
                "specifier": TEST_SPECIFIER,
                "amount": TEST_AMOUNT,
                "is_complete": True,
                "user_id": TEST_USER_ID,
            }
        ],
        "notification": [
            {
                "specifier": TEST_SPECIFIER,
                "group_id": TEST_GROUP_ID,
            }
        ],
    }

    populate_mock_db(db, entities)
    with db.scoped_session() as session:
        _create_engagement_notifications(session)
        all_notifications = session.query(Notification).all()

        assert len(all_notifications) == 1


def test_ignore_existing_disbursement(app):
    with app.app_context():
        db = get_db()

    entities = {
        "user_challenges": [
            {
                "challenge_id": TEST_CHALLENGE_ID,
                "specifier": TEST_SPECIFIER,
                "amount": TEST_AMOUNT,
                "is_complete": True,
                "user_id": TEST_USER_ID,
            }
        ],
        "challenge_disbursements": [
            {
                "challenge_id": TEST_CHALLENGE_ID,
                "specifier": TEST_SPECIFIER,
            }
        ],
    }

    populate_mock_db(db, entities)
    with db.scoped_session() as session:
        _create_engagement_notifications(session)
        all_notifications = session.query(Notification).all()
        assert len(all_notifications) == 0
