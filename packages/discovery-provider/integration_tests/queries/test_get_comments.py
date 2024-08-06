from datetime import datetime
from integration_tests.utils import populate_mock_db
from src.queries.get_comments import get_track_comments
from src.utils.db_session import get_db
import logging

logger = logging.getLogger(__name__)

test_entities = {
    "comments": [
        {
            "comment_id": i,
            "user_id": 1,
            "entity_id": 1,
            "entity_type": "Track",
            "created_at": datetime(2022, 11, i),
        }
        for i in range(1, 11)
    ]
    + [
        {
            "user_id": 1,
            "entity_id": 1,
            "entity_type": "Track",
            "created_at": datetime(2022, 11, i),
            "comment_id": i + 100,
        }
        for i in range(1, 11)
    ],
    "comment_threads": [
        {"parent_comment_id": 1, "comment_id": i} for i in range(2, 11)
    ],
    "tracks": [
        {
            "track_id": 1,
            "title": "a",
            "owner_id": 10,
            "is_stream_gated": True,
            "stream_conditions": {
                "usdc_purchase": {
                    "price": 100,
                    "splits": {"some_user_bank": 1000000},
                }
            },
        },
    ],
}


def test_get_comments(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)
        comments = get_track_comments({}, 1)
        logger.info(f"asdf comments {comments}")
        assert len(comments) == 5
