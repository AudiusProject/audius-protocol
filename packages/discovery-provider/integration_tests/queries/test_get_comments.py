import logging
from datetime import datetime

from integration_tests.utils import populate_mock_db
from src.queries.get_comments import get_comment_replies, get_track_comments
from src.utils.db_session import get_db
from src.utils.helpers import decode_string_id

logger = logging.getLogger(__name__)

test_entities = {
    "comments": [
        {  # parents
            "comment_id": i,
            "user_id": 1,
            "entity_id": 1,
            "entity_type": "Track",
            "created_at": datetime(2022, 1, i),
        }
        for i in range(1, 11)
    ]
    + [
        {  # replies
            "user_id": 1,
            "entity_id": 1,
            "entity_type": "Track",
            "created_at": datetime(2024, 1, i),
            "comment_id": i + 100,
        }
        for i in range(1, 11)
    ],
    "comment_threads": [
        {"parent_comment_id": 10, "comment_id": i} for i in range(102, 111)
    ],
    "comment_reactions": [{"comment_id": 10, "user_id": 1}],
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


def test_get_comments_default(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)
        comments = get_track_comments({"limit": 5, "offset": 5}, 1)

        assert len(comments) == 5
        for comment in comments:
            if decode_string_id(comment["id"]) == 10:
                assert len(comment["replies"]) == 3
                assert comment["reply_count"] == 9
                assert comment["react_count"] == 1
            else:
                assert len(comment["replies"]) == 0

            assert 6 <= decode_string_id(comment["id"]) <= 10


def test_get_comments_page(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)
        comments = get_track_comments({"limit": 5, "offset": 5}, 1)

        for comment in comments:
            assert 6 <= decode_string_id(comment["id"]) <= 10


def test_get_comments_replies(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)
        comments = get_comment_replies({"limit": 2, "offset": 2}, 10)
        for comment in comments:
            assert 104 <= decode_string_id(comment["id"]) <= 106
