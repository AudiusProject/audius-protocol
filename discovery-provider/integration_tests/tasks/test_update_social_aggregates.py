import logging
from datetime import datetime, timedelta
from typing import List

from integration_tests.utils import populate_mock_db
from src.models.tracks.aggregate_track import AggregateTrack
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


# Tests
def test_update_aggregate_track(app):
    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = {
        "tracks": [
            {"track_id": 1, "title": "track 1", "owner_id": 1},
        ],
        "user": [{"user_id": 1}],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:

        results: List[AggregateTrack] = (
            session.query(AggregateTrack).order_by(AggregateTrack.play_item_id).all()
        )
        logger.info(f"asdf results {results}")
