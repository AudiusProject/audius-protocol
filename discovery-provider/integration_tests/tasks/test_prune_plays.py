import logging
from datetime import datetime, timedelta
from typing import List

from integration_tests.utils import populate_mock_db
from src.models.social.play import Play
from src.models.social.plays_archive import PlaysArchive
from src.tasks.prune_plays import _prune_plays
from src.utils.config import shared_config
from src.utils.db_session import get_db

REDIS_URL = shared_config["redis"]["url"]
CURRENT_TIMESTAMP = datetime.now()

logger = logging.getLogger(__name__)


# Tests
def test_prune_plays_old_date(app):
    """Test that we should archive plays with old dates"""
    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = {
        "tracks": [
            {"track_id": 1, "title": "track 1"},
            {"track_id": 2, "title": "track 2"},
            {"track_id": 3, "title": "track 3"},
        ],
        "plays": [
            # Current Plays
            {"item_id": 1, "created_at": CURRENT_TIMESTAMP - timedelta(weeks=140)},
            {"item_id": 3, "created_at": CURRENT_TIMESTAMP - timedelta(weeks=110)},
            {"item_id": 2, "created_at": CURRENT_TIMESTAMP - timedelta(weeks=110)},
            {"item_id": 2, "created_at": CURRENT_TIMESTAMP - timedelta(weeks=90)},
            {"item_id": 1, "created_at": CURRENT_TIMESTAMP - timedelta(weeks=30)},
            {"item_id": 3, "created_at": CURRENT_TIMESTAMP - timedelta(weeks=3)},
            {"item_id": 3, "created_at": CURRENT_TIMESTAMP},
        ],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        _prune_plays(
            session,
            CURRENT_TIMESTAMP,
            cutoff_timestamp=datetime.now() - timedelta(weeks=6),
        )
        # verify plays
        plays_result: List[Play] = session.query(Play).order_by(Play.id).all()
        assert len(plays_result) == 2
        assert plays_result[0].id == 6
        assert plays_result[0].play_item_id == 3
        assert plays_result[0].created_at == CURRENT_TIMESTAMP - timedelta(weeks=3)

        assert plays_result[1].id == 7
        assert plays_result[1].play_item_id == 3
        assert plays_result[1].created_at == CURRENT_TIMESTAMP

        # verify archive
        plays_archive_result: List[PlaysArchive] = (
            session.query(PlaysArchive).order_by(PlaysArchive.id).all()
        )

        assert len(plays_archive_result) == 5
        assert plays_archive_result[0].id == 1
        assert plays_archive_result[0].play_item_id == 1
        assert plays_archive_result[0].archived_at == CURRENT_TIMESTAMP

        assert plays_archive_result[1].id == 2
        assert plays_archive_result[1].play_item_id == 3
        assert plays_archive_result[1].archived_at == CURRENT_TIMESTAMP

        assert plays_archive_result[2].id == 3
        assert plays_archive_result[2].play_item_id == 2
        assert plays_archive_result[2].archived_at == CURRENT_TIMESTAMP

        assert plays_archive_result[3].id == 4
        assert plays_archive_result[3].play_item_id == 2
        assert plays_archive_result[3].archived_at == CURRENT_TIMESTAMP

        assert plays_archive_result[4].id == 5
        assert plays_archive_result[4].play_item_id == 1
        assert plays_archive_result[4].archived_at == CURRENT_TIMESTAMP


def test_prune_plays_max_batch(app):
    """Test that we should archive plays in batches"""
    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = {
        "tracks": [
            {"track_id": 1, "title": "track 1"},
            {"track_id": 2, "title": "track 2"},
            {"track_id": 3, "title": "track 3"},
        ],
        "plays": [
            # Current Plays
            {"item_id": 1, "created_at": CURRENT_TIMESTAMP - timedelta(weeks=140)},
            {"item_id": 3, "created_at": CURRENT_TIMESTAMP - timedelta(weeks=110)},
            {"item_id": 2, "created_at": CURRENT_TIMESTAMP - timedelta(weeks=110)},
            {"item_id": 3, "created_at": CURRENT_TIMESTAMP},
        ],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        _prune_plays(session, CURRENT_TIMESTAMP, max_batch=1)
        # verify plays
        plays_result: List[Play] = session.query(Play).order_by(Play.id).all()
        assert len(plays_result) == 3
        assert plays_result[0].id == 2
        assert plays_result[0].play_item_id == 3
        assert plays_result[0].created_at == CURRENT_TIMESTAMP - timedelta(weeks=110)

        assert plays_result[1].id == 3
        assert plays_result[1].play_item_id == 2
        assert plays_result[1].created_at == CURRENT_TIMESTAMP - timedelta(weeks=110)

        assert plays_result[2].id == 4
        assert plays_result[2].play_item_id == 3
        assert plays_result[2].created_at == CURRENT_TIMESTAMP

        # verify archive
        plays_archive_result: List[PlaysArchive] = (
            session.query(PlaysArchive).order_by(PlaysArchive.id).all()
        )

        assert len(plays_archive_result) == 1
        assert plays_archive_result[0].id == 1
        assert plays_archive_result[0].play_item_id == 1
        assert plays_archive_result[0].archived_at == CURRENT_TIMESTAMP


def test_prune_plays_skip_prune(app):
    """Test that we should not prune if there are no plays before cutoff"""
    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = {
        "tracks": [
            {"track_id": 3, "title": "track 3"},
        ],
        "plays": [
            # Current Plays
            {"item_id": 3, "created_at": CURRENT_TIMESTAMP},
        ],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        _prune_plays(session, CURRENT_TIMESTAMP)
        # verify plays
        plays_result: List[Play] = session.query(Play).order_by(Play.id).all()
        assert len(plays_result) == 1

        # verify archive
        plays_archive_result: List[PlaysArchive] = (
            session.query(PlaysArchive).order_by(PlaysArchive.id).all()
        )

        assert len(plays_archive_result) == 0
