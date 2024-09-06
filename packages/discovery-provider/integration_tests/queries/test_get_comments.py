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
            "track_timestamp_s": i 
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
        {"parent_comment_id": 10, "comment_id": i} for i in range(101, 111)
    ],
    "comment_reactions": [{"comment_id": 5, "user_id": 1}],
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
        comments = get_track_comments({"sort_method": "newest"}, 1)

        assert len(comments) == 5
        for comment in comments:
            if decode_string_id(comment["id"]) == 10:
                assert len(comment["replies"]) == 3
            else:
                assert len(comment["replies"]) == 0

            assert 5 <= decode_string_id(comment["id"]) <= 10


def test_get_comments_page(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)
        comments = get_track_comments({"limit": 5, "offset": 5, "sort_method": "newest"}, 1)

        for comment in comments:
            assert 1 <= decode_string_id(comment["id"]) <= 5


def test_get_comments_sort(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)

        # Testing default sort "top"
        comments = get_track_comments({}, 1)
        assert decode_string_id(comments[0]["id"]) == 5
        assert comments[0]["react_count"] == 1

        # Testing sort "top"
        comments = get_track_comments({"sort_method": "top"}, 1)
        assert decode_string_id(comments[0]["id"]) == 5
        assert comments[0]["react_count"] == 1

        # Testing sort "newest"
        comments = get_track_comments({"sort_method": "newest"}, 1)
        assert decode_string_id(comments[0]["id"]) == 10

        # Testing sort "timestamp"
        comments = get_track_comments({"sort_method": "timestamp"}, 1)
        assert decode_string_id(comments[0]["id"]) == 1
        assert comments[0]["track_timestamp_s"] == 1


def test_get_comments_replies(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)
        comments = get_comment_replies({"limit": 2, "offset": 2, "sort_method": "newest"}, 10)
        for comment in comments:
            assert 103 <= decode_string_id(comment["id"]) <= 105
