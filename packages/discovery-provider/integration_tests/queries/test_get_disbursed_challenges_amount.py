from datetime import datetime, timedelta

from integration_tests.utils import populate_mock_db
from src.queries.get_disbursed_challenges_amount import (
    get_disbursed_challenges_amount,
    get_weekly_pool_window_start,
)
from src.utils.db_session import get_db


def test_get_disbursed_challenges_amount(app):
    with app.app_context():
        db = get_db()

    entities = {
        "challenge_disbursements": [
            {
                "challenge_id": "p",
                "specifier": "1",
                "user_id": 1,
                "amount": "500000000",
            },
            {
                "challenge_id": "p",
                "specifier": "2",
                "user_id": 2,
                "amount": "1000000000",
            },
            {
                "challenge_id": "p",
                "specifier": "3",
                "user_id": 3,
                "amount": "2000000000",
                "created_at": datetime.now() - timedelta(days=8),
            },
            {
                "challenge_id": "l",
                "specifier": "1",
                "user_id": 1,
                "amount": "400000000",
            },
            {
                "challenge_id": "l",
                "specifier": "2",
                "user_id": 2,
                "amount": "1200000000",
            },
        ],
    }
    populate_mock_db(db, entities)
    with db.scoped_session() as session:
        amount_disbursed = get_disbursed_challenges_amount(
            session, "p", datetime.now() - timedelta(days=7)
        )
        assert amount_disbursed == 15


def test_get_disbursed_challenges_amount_invalid(app):
    with app.app_context():
        db = get_db()

    entities = {
        "challenge_disbursements": [
            {
                "challenge_id": "p",
                "specifier": "1",
                "user_id": 1,
                "amount": "500000000",
            },
        ],
    }
    populate_mock_db(db, entities)
    with db.scoped_session() as session:
        amount_disbursed = get_disbursed_challenges_amount(
            session, "invalid", datetime.now() - timedelta(days=7)
        )
        assert amount_disbursed == 0


def test_get_weekly_pool_window_start():
    d1 = get_weekly_pool_window_start(datetime(year=2023, month=10, day=10, hour=10))
    assert d1 == datetime(year=2023, month=10, day=9, hour=16)

    d2 = get_weekly_pool_window_start(datetime(year=2023, month=10, day=13, hour=5))
    assert d2 == datetime(year=2023, month=10, day=9, hour=16)

    d3 = get_weekly_pool_window_start(datetime(year=2023, month=10, day=9, hour=10))
    assert d3 == datetime(year=2023, month=10, day=2, hour=16)
