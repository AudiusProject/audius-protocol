import logging
from datetime import datetime

from integration_tests.utils import populate_mock_db
from src.models.comments.comment_report import COMMENT_REPORT_KARMA_THRESHOLD
from src.queries.get_comments import get_paginated_replies, get_track_comments
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
            "is_edited": i == 10,
            "track_timestamp_s": i,
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
                assert comment["reply_count"] == 10
                assert comment["react_count"] == 0
                assert comment["is_edited"] == True
            else:
                assert len(comment["replies"]) == 0

            assert 5 <= decode_string_id(comment["id"]) <= 10


def test_get_comments_page(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)
        comments = get_track_comments(
            {"limit": 5, "offset": 5, "sort_method": "newest"}, 1
        )

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


def test_get_comments_pinned(app):
    entities = {
        "comments": [
            {
                "comment_id": 1,
                "user_id": 1,
                "entity_id": 1,
                "entity_type": "Track",
                "created_at": datetime(2022, 1, 1),
                "track_timestamp_s": 1,
            },
            {
                "comment_id": 2,
                "user_id": 1,
                "entity_id": 1,
                "entity_type": "Track",
                "created_at": datetime(2022, 1, 2),
                "track_timestamp_s": 2,
            },
        ],
        "tracks": [{"track_id": 1, "owner_id": 10, "pinned_comment_id": 2}],
    }

    with app.app_context():
        db = get_db()
        populate_mock_db(db, entities)

        comments = get_track_comments({"sort_method": "top"}, 1)
        assert decode_string_id(comments[0]["id"]) == 2

        comments = get_track_comments({"sort_method": "newest"}, 1)
        assert decode_string_id(comments[0]["id"]) == 2

        comments = get_track_comments({"sort_method": "timestamp"}, 1)
        assert decode_string_id(comments[0]["id"]) == 2


def test_get_comments_replies(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)
        comments = get_paginated_replies(
            {"limit": 2, "offset": 2, "sort_method": "newest"}, 10
        )
        for comment in comments:
            assert 103 <= decode_string_id(comment["id"]) <= 105


def test_get_muted_comments(app):
    entities = {
        "comments": [
            {
                "comment_id": 1,
                "user_id": 1,
                "entity_id": 1,
                "entity_type": "Track",
                "created_at": datetime(2022, 1, 1),
                "track_timestamp_s": 1,
            },
        ],
        "comment_notification_settings": [
            {
                "user_id": 1,
                "entity_id": 1,
                "entity_type": "Comment",
                "is_muted": True,
            }
        ],
        "tracks": [{"track_id": 1, "owner_id": 10}],
    }

    with app.app_context():
        db = get_db()
        populate_mock_db(db, entities)

        comments = get_track_comments({}, 1)
        assert comments[0]["is_muted"] == True


def test_get_deleted_comments(app):
    entities = {
        "comments": [
            {
                "comment_id": 0,
                "user_id": 1,
                "entity_id": 1,
                "entity_type": "Track",
                "created_at": datetime(2022, 1, 2),
                "track_timestamp_s": 2,
            },
            {
                "comment_id": 1,
                "user_id": 1,
                "entity_id": 1,
                "entity_type": "Track",
                "created_at": datetime(2022, 1, 2),
                "track_timestamp_s": 3,
                "is_delete": True,
            },
        ],
        "tracks": [{"track_id": 1, "owner_id": 10}],
    }

    with app.app_context():
        db = get_db()
        populate_mock_db(db, entities)

        comments = get_track_comments({"sort_method": "top"}, 1)
        assert len(comments) == 1


def test_get_tombstone_comments(app):
    entities = {
        "comments": [
            {
                "comment_id": i,
                "user_id": 1,
                "entity_id": 1,
                "entity_type": "Track",
                "created_at": datetime(2022, 1, 2),
                "track_timestamp_s": 2,
            }
            for i in range(1, 5)
        ]
        + [
            {  # deleted comment
                "comment_id": 0,
                "user_id": 1,
                "entity_id": 1,
                "entity_type": "Track",
                "created_at": datetime(2022, 1, 1),
                "track_timestamp_s": 1,
                "is_delete": True,
            },
            {  # this comment is a reply to the deleted comment
                "comment_id": 6,
                "user_id": 1,
                "entity_id": 1,
                "entity_type": "Track",
                "created_at": datetime(2022, 1, 2),
                "track_timestamp_s": 2,
            },
        ],
        "tracks": [{"track_id": 1, "owner_id": 10}],
        "comment_threads": [{"parent_comment_id": 0, "comment_id": 6}],
    }

    with app.app_context():
        db = get_db()
        populate_mock_db(db, entities)

        # sort by top
        comments = get_track_comments({"sort_method": "top"}, 1)

        assert decode_string_id(comments[0]["id"]) == 1  # misc comment should be top
        assert (
            decode_string_id(comments[-1]["id"]) == 0
        )  # deleted comment should be last
        assert comments[-1]["is_tombstone"] == True  # deleted comment should be last

        # sort by newest
        comments = get_track_comments({"sort_method": "newest"}, 1)
        assert decode_string_id(comments[0]["id"]) == 1  # misc comment should be top
        assert (
            decode_string_id(comments[-1]["id"]) == 0
        )  # deleted comment should be last
        assert comments[-1]["is_tombstone"] == True  # deleted comment should be last

        # sort by timestamp
        comments = get_track_comments({"sort_method": "timestamp"}, 1)
        assert decode_string_id(comments[0]["id"]) == 1  # misc comment should be top
        assert (
            decode_string_id(comments[-1]["id"])
        ) == 0  # deleted comment should be last
        assert comments[-1]["is_tombstone"] == True  # deleted comment should be last


def test_get_reported_comments(app):
    "Test that we do not receive comments that have been reported by artist or high-karma user"

    entities = {
        "comments": [
            {
                "comment_id": 1,
                "user_id": 2,
                "entity_id": 1,
            },
            {
                "comment_id": 2,
                "user_id": 2,
                "entity_id": 1,
            },
        ],
        "comment_reports": [
            {"comment_id": 1, "user_id": 1},
            {"comment_id": 2, "user_id": 3},
        ],
        "users": [{"user_id": 1}, {"user_id": 2}, {"user_id": 4}],
        "aggregate_user": [
            {"user_id": 3, "follower_count": COMMENT_REPORT_KARMA_THRESHOLD + 1}
        ],
        "tracks": [{"track_id": 1, "owner_id": 1}],
    }

    with app.app_context():
        db = get_db()
        populate_mock_db(db, entities)

        comments = get_track_comments({}, 1, 4)
        assert len(comments) == 0


def test_get_comments_mentions(app):
    entities = {
        "comments": [
            {
                "comment_id": 1,
                "user_id": 202,
                "entity_id": 1,
            },
            {
                "comment_id": 2,
                "user_id": 202,
                "entity_id": 1,
            },
        ],
        "comment_mentions": [
            {"comment_id": 1, "user_id": 101},
            {"comment_id": 1, "user_id": 202},
            {"comment_id": 1, "user_id": 321},
        ],
        "users": [
            {"user_id": 101, "handle": "dylan"},
            {"user_id": 202, "handle": "kj"},
            {"user_id": 321, "handle": "jd"},
        ],
        "tracks": [{"track_id": 1, "owner_id": 1}],
    }

    with app.app_context():
        db = get_db()
        populate_mock_db(db, entities)
        comments = get_track_comments({"sort_method": "newest"}, 1)

        assert len(comments) == 2
        assert len(comments[0]["mentions"]) == 0
        assert len(comments[1]["mentions"]) == 3
        assert comments[1]["mentions"] == [
            {"user_id": 101, "handle": "dylan"},
            {"user_id": 202, "handle": "kj"},
            {"user_id": 321, "handle": "jd"},
        ]
