import logging
from typing import List

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


# ========================================== Start Tests ==========================================
def test_usdc_transfer_notification(app):
    with app.app_context():
        db = get_db()

    test_entities = {
        "users": [
            {"user_id": 1, "wallet": "0x2306d1abbbf961241fa7caeee65f1214d94ce262"}
        ],
        "usdc_user_bank_accounts": [
            {
                "ethereum_address": "0x2306d1abbbf961241fa7caeee65f1214d94ce262",
                "bank_account": "8q8MSG4cdyDLoDXRGBLQugA6oHtQmbCtVVV1aEuPdYTj",
            }
        ],
    }
    populate_mock_db(db, test_entities)
    test_actions = {
        "usdc_transactions_history": [
            {
                "slot": 4,
                "signature": "4HMtqP6k5ugi5jhCQo5CpqKzjxREhsZ4QTE2XDo48v4JBaDjS4kWXo7EixucKEFkwHxF9j3Qzp2ZjLdGpN4FRQVt",
                "user_bank": "8q8MSG4cdyDLoDXRGBLQugA6oHtQmbCtVVV1aEuPdYTj",
                "transaction_type": "transfer",
                "method": "send",
                "change": -100,
                "balance": 100,
                "tx_metadata": "3nmLmEzwBBjERiV9UU1a4JXzESwDjrKZdSjP1KG4M9Mc",
            }
        ],
    }
    populate_mock_db(db, test_actions)

    with db.scoped_session() as session:
        notifications: List[Notification] = session.query(Notification).all()
        assert len(notifications) == 1
        notification = notifications[0]
        assert notification.user_ids == [1]
        assert notification.specifier == "1"
        assert (
            notification.group_id
            == "usdc_transfer:1:signature:4HMtqP6k5ugi5jhCQo5CpqKzjxREhsZ4QTE2XDo48v4JBaDjS4kWXo7EixucKEFkwHxF9j3Qzp2ZjLdGpN4FRQVt"
        )
        assert notification.slot == 4

        assert notification.data == {
            "user_id": 1,
            "user_bank": "8q8MSG4cdyDLoDXRGBLQugA6oHtQmbCtVVV1aEuPdYTj",
            "signature": "4HMtqP6k5ugi5jhCQo5CpqKzjxREhsZ4QTE2XDo48v4JBaDjS4kWXo7EixucKEFkwHxF9j3Qzp2ZjLdGpN4FRQVt",
            "change": -100,
            "balance": 100,
            "receiver_account": "3nmLmEzwBBjERiV9UU1a4JXzESwDjrKZdSjP1KG4M9Mc",
        }


def test_usdc_transfer_notification_not_send(app):
    with app.app_context():
        db = get_db()

    test_entities = {
        "users": [
            {"user_id": 1, "wallet": "0x2306d1abbbf961241fa7caeee65f1214d94ce262"}
        ],
        "usdc_user_bank_accounts": [
            {
                "signature": "4HMtqP6k5ugi5jhCQo5CpqKzjxREhsZ4QTE2XDo48v4JBaDjS4kWXo7EixucKEFkwHxF9j3Qzp2ZjLdGpN4FRQVt",
                "ethereum_address": "0x2306d1abbbf961241fa7caeee65f1214d94ce262",
                "bank_account": "8q8MSG4cdyDLoDXRGBLQugA6oHtQmbCtVVV1aEuPdYTj",
            }
        ],
    }
    populate_mock_db(db, test_entities)
    test_actions = {
        "usdc_transactions_history": [
            {
                "slot": 4,
                "user_bank": "8q8MSG4cdyDLoDXRGBLQugA6oHtQmbCtVVV1aEuPdYTj",
                "transaction_type": "transfer",
                "method": "receive",
                "change": -100,
                "balance": 100,
            }
        ],
    }
    populate_mock_db(db, test_actions)

    with db.scoped_session() as session:
        notifications: List[Notification] = (
            session.query(Notification)
            .filter(Notification.type == "usdc_transfer")
            .all()
        )
        assert len(notifications) == 0


def test_usdc_withdrawal_notification(app):
    with app.app_context():
        db = get_db()

    test_entities = {
        "users": [
            {"user_id": 1, "wallet": "0x2306d1abbbf961241fa7caeee65f1214d94ce262"}
        ],
        "usdc_user_bank_accounts": [
            {
                "ethereum_address": "0x2306d1abbbf961241fa7caeee65f1214d94ce262",
                "bank_account": "8q8MSG4cdyDLoDXRGBLQugA6oHtQmbCtVVV1aEuPdYTj",
            }
        ],
    }
    populate_mock_db(db, test_entities)
    test_actions = {
        "usdc_transactions_history": [
            {
                "slot": 4,
                "signature": "4HMtqP6k5ugi5jhCQo5CpqKzjxREhsZ4QTE2XDo48v4JBaDjS4kWXo7EixucKEFkwHxF9j3Qzp2ZjLdGpN4FRQVt",
                "user_bank": "8q8MSG4cdyDLoDXRGBLQugA6oHtQmbCtVVV1aEuPdYTj",
                "transaction_type": "withdrawal",
                "method": "send",
                "change": -100,
                "balance": 100,
                "tx_metadata": "3nmLmEzwBBjERiV9UU1a4JXzESwDjrKZdSjP1KG4M9Mc",
            }
        ],
    }
    populate_mock_db(db, test_actions)

    with db.scoped_session() as session:
        notifications: List[Notification] = session.query(Notification).all()
        assert len(notifications) == 1
        notification = notifications[0]
        assert notification.user_ids == [1]
        assert notification.specifier == "1"
        assert (
            notification.group_id
            == "usdc_withdrawal:1:signature:4HMtqP6k5ugi5jhCQo5CpqKzjxREhsZ4QTE2XDo48v4JBaDjS4kWXo7EixucKEFkwHxF9j3Qzp2ZjLdGpN4FRQVt"
        )
        assert notification.slot == 4

        assert notification.data == {
            "user_id": 1,
            "user_bank": "8q8MSG4cdyDLoDXRGBLQugA6oHtQmbCtVVV1aEuPdYTj",
            "signature": "4HMtqP6k5ugi5jhCQo5CpqKzjxREhsZ4QTE2XDo48v4JBaDjS4kWXo7EixucKEFkwHxF9j3Qzp2ZjLdGpN4FRQVt",
            "change": -100,
            "balance": 100,
            "receiver_account": "3nmLmEzwBBjERiV9UU1a4JXzESwDjrKZdSjP1KG4M9Mc",
        }
