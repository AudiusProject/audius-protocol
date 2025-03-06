from integration_tests.utils import populate_mock_db
from src.queries.get_total_plays import _get_total_plays
from src.utils.db_session import get_db


def test_get_total_plays(app):
    """Tests that total plays can be queried"""
    with app.app_context():
        db = get_db()

    # Set up test data
    test_entities = {
        "aggregate_plays": [
            {"count": 100},
            {"count": 200},
            {"count": 300},
        ]
    }

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        total = _get_total_plays(session)

    assert total == 600


def test_get_total_plays_empty(app):
    """Tests that total plays returns 0 when no plays exist"""
    with app.app_context():
        db = get_db()

    # Set up empty test data
    test_entities = {"aggregate_plays": []}

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        total = _get_total_plays(session)

    assert total == 0
