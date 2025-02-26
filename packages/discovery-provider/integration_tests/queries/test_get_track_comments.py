import logging
from datetime import datetime

from integration_tests.utils import populate_mock_db
from src.models.comments.comment_report import COMMENT_KARMA_THRESHOLD
from src.queries.comments import (
    COMMENT_ROOT_DEFAULT_LIMIT,
    get_paginated_replies,
    get_track_comments,
)
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
        for i in range(1, 20)
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
        response = get_track_comments({"sort_method": "newest"}, 1)

        # Check that the response has the expected structure
        assert "data" in response
        assert "related" in response

        # Get the comments from the data field
        comments = response["data"]
        assert len(comments) == COMMENT_ROOT_DEFAULT_LIMIT
        for comment in comments:
            if decode_string_id(comment["id"]) == 10:
                assert len(comment["replies"]) == 3
                assert comment["reply_count"] == 10
                assert comment["react_count"] == 0
                assert comment["is_edited"] == True
            else:
                assert len(comment["replies"]) == 0

            # We have 20 comments total, we should only get the last 15
            assert 5 <= decode_string_id(comment["id"]) <= 20


def test_get_comments_page(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)
        response = get_track_comments(
            {"limit": 5, "offset": 5, "sort_method": "newest"}, 1
        )

        # Get the comments from the data field
        comments = response["data"]
        for comment in comments:
            assert 10 <= decode_string_id(comment["id"]) <= 15


def test_get_comments_sort(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)

        # Testing default sort "top"
        response = get_track_comments({}, 1)
        comments = response["data"]
        assert decode_string_id(comments[0]["id"]) == 5
        assert comments[0]["react_count"] == 1

        # Testing sort "top"
        response = get_track_comments({"sort_method": "top"}, 1)
        comments = response["data"]
        assert decode_string_id(comments[0]["id"]) == 5
        assert comments[0]["react_count"] == 1

        # Testing sort "newest"
        response = get_track_comments({"sort_method": "newest"}, 1)
        comments = response["data"]
        assert decode_string_id(comments[0]["id"]) == 19

        # Testing sort "timestamp"
        response = get_track_comments({"sort_method": "timestamp"}, 1)
        comments = response["data"]
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

        response = get_track_comments({"sort_method": "top"}, 1)
        comments = response["data"]
        assert decode_string_id(comments[0]["id"]) == 2

        response = get_track_comments({"sort_method": "newest"}, 1)
        comments = response["data"]
        assert decode_string_id(comments[0]["id"]) == 2

        response = get_track_comments({"sort_method": "timestamp"}, 1)
        comments = response["data"]
        assert decode_string_id(comments[0]["id"]) == 2


def test_get_comments_replies(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)
        response = get_paginated_replies(
            {"limit": 2, "offset": 2, "sort_method": "newest"}, 10
        )
        replies = response["data"]
        for reply in replies:
            assert 103 <= decode_string_id(reply["id"]) <= 105


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

        response = get_track_comments({}, 1)
        comments = response["data"]
        assert comments[0]["is_muted"] == True


def test_get_comments_from_muted_user_by_track_owner(app):
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
        "muted_users": [
            {
                "muted_user_id": 1,
                "user_id": 10,  # the owner of this track
            }
        ],
        "tracks": [{"track_id": 1, "owner_id": 10}],
    }

    with app.app_context():
        db = get_db()
        populate_mock_db(db, entities)

        # the muted user should see their own comment
        response = get_track_comments({}, 1, current_user_id=1)
        comments = response["data"]
        assert len(comments) == 1

        # the person who muted the user should not see the comment
        response = get_track_comments({}, 1, current_user_id=10)
        comments = response["data"]
        assert len(comments) == 0

        # to a third party user, there should be no comments
        # because the track owner muted the user
        response = get_track_comments({}, 1, current_user_id=2)
        comments = response["data"]
        assert len(comments) == 0


def test_get_comments_from_muted_user_by_other_user(app):
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
        "muted_users": [
            {
                "muted_user_id": 1,
                "user_id": 9,
            }
        ],
        "tracks": [{"track_id": 1, "owner_id": 10}],
    }

    with app.app_context():
        db = get_db()
        populate_mock_db(db, entities)

        # the muted user should see their own comment
        response = get_track_comments({}, 1, current_user_id=1)
        comments = response["data"]
        assert len(comments) == 1

        # the person who muted the user should not see the comment
        response = get_track_comments({}, 1, current_user_id=9)
        comments = response["data"]
        assert len(comments) == 0

        # to a third party user, they should still see the comment
        response = get_track_comments({}, 1, current_user_id=2)
        comments = response["data"]
        assert len(comments) == 1


def test_get_comment_replies_from_muted_user_by_track_owner(app):
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
        "comment_threads": [{"parent_comment_id": 1, "comment_id": 2}],
        "muted_users": [
            {
                "muted_user_id": 1,
                "user_id": 10,  # the owner of this track
            }
        ],
        "tracks": [{"track_id": 1, "owner_id": 10}],
    }

    with app.app_context():
        db = get_db()
        populate_mock_db(db, entities)

        # the person who muted the user should not see the comment
        response = get_paginated_replies(
            {"limit": 10, "offset": 0, "sort_method": "newest"}, 1, current_user_id=10
        )
        replies = response["data"]
        assert len(replies) == 0

        # to a third party user, there should be no comment replies
        # because the track owner muted the user
        response = get_paginated_replies(
            {"limit": 10, "offset": 0, "sort_method": "newest"}, 1, current_user_id=2
        )
        replies = response["data"]
        assert len(replies) == 0

        # the muted user should see their own comment
        response = get_paginated_replies(
            {"limit": 10, "offset": 0, "sort_method": "newest"}, 1, current_user_id=1
        )
        replies = response["data"]
        assert len(replies) == 1


def test_get_comment_replies_from_muted_user_by_other_user(app):
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
        "comment_threads": [{"parent_comment_id": 1, "comment_id": 2}],
        "muted_users": [
            {
                "muted_user_id": 1,
                "user_id": 9,
            }
        ],
        "tracks": [{"track_id": 1, "owner_id": 10}],
    }

    with app.app_context():
        db = get_db()
        populate_mock_db(db, entities)

        # the person who muted the user should not see the comment
        response = get_paginated_replies(
            {"limit": 10, "offset": 0, "sort_method": "newest"}, 1, current_user_id=9
        )
        replies = response["data"]
        assert len(replies) == 0

        # to a third party user, they should still see the comment replies
        response = get_paginated_replies(
            {"limit": 10, "offset": 0, "sort_method": "newest"}, 1, current_user_id=2
        )
        replies = response["data"]
        assert len(replies) == 1

        # the muted user should see their own comment
        response = get_paginated_replies(
            {"limit": 10, "offset": 0, "sort_method": "newest"}, 1, current_user_id=1
        )
        replies = response["data"]
        assert len(replies) == 1


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

        response = get_track_comments({"sort_method": "top"}, 1)
        comments = response["data"]
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
        response = get_track_comments({"sort_method": "top"}, 1)
        comments = response["data"]

        assert decode_string_id(comments[0]["id"]) == 1  # misc comment should be top
        assert (
            decode_string_id(comments[-1]["id"]) == 0
        )  # deleted comment should be last
        assert comments[-1]["is_tombstone"] == True  # deleted comment should be last

        # sort by newest
        response = get_track_comments({"sort_method": "newest"}, 1)
        comments = response["data"]
        assert decode_string_id(comments[0]["id"]) == 1  # misc comment should be top
        assert (
            decode_string_id(comments[-1]["id"]) == 0
        )  # deleted comment should be last
        assert comments[-1]["is_tombstone"] == True  # deleted comment should be last

        # sort by timestamp
        response = get_track_comments({"sort_method": "timestamp"}, 1)
        comments = response["data"]
        assert decode_string_id(comments[0]["id"]) == 1  # misc comment should be top
        assert (
            decode_string_id(comments[-1]["id"])
        ) == 0  # deleted comment should be last
        assert comments[-1]["is_tombstone"] == True  # deleted comment should be last


def test_get_reported_comments(app):
    "Test that we do not receive comments that have been reported by artist or high-karma user"

    initial_entities = {
        "aggregate_user": [{"user_id": 3, "follower_count": COMMENT_KARMA_THRESHOLD}],
    }

    entities = {
        "comments": [
            {
                "comment_id": 1,
                "user_id": 2,
                "entity_id": 1,
                "text": "b",
            },
            {"comment_id": 2, "user_id": 2, "entity_id": 1, "text": "a"},
        ],
        "comment_reports": [
            {"comment_id": 1, "user_id": 1},
            {"comment_id": 2, "user_id": 3},
        ],
        "users": [{"user_id": 1}, {"user_id": 2}, {"user_id": 3}, {"user_id": 4}],
        "tracks": [{"track_id": 1, "owner_id": 1}],
    }

    with app.app_context():
        db = get_db()
        populate_mock_db(db, initial_entities)
        populate_mock_db(db, entities)

        response = get_track_comments({}, 1, 4)
        comments = response["data"]
        assert len(comments) == 0


def test_get_comment_mentions(app):
    entities = {
        "tracks": [{"track_id": 1, "owner_id": 101}],
        "users": [
            {"user_id": 101, "handle": "dylan"},
            {"user_id": 202, "handle": "kj"},
            {"user_id": 321, "handle": "jd"},
        ],
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
            {"comment_id": 1, "user_id": 202, "is_delete": True},
            {"comment_id": 1, "user_id": 321},
            {"comment_id": 2, "user_id": 321, "is_delete": True},
        ],
    }

    with app.app_context():
        db = get_db()
        populate_mock_db(db, entities)
        response = get_track_comments({"sort_method": "newest"}, 1)
        comments = response["data"]

        assert len(comments) == 2
        assert len(comments[0]["mentions"]) == 0
        assert len(comments[1]["mentions"]) == 2
        assert comments[1]["mentions"] == [
            {"user_id": 101, "handle": "dylan"},
            {"user_id": 321, "handle": "jd"},
        ]


def test_get_track_comments_related_field(app):
    """Test that the related field is included in the response and contains the expected user and track information"""
    entities = {
        "comments": [
            {
                "comment_id": 1,
                "user_id": 1,
                "entity_id": 1,
                "entity_type": "Track",
                "created_at": datetime(2022, 1, 1),
                "track_timestamp_s": 1,
                "text": "Test comment",
            },
        ],
        "tracks": [
            {
                "track_id": 1,
                "title": "Test Track",
                "owner_id": 10,
            }
        ],
        "users": [
            {"user_id": 1, "handle": "user1", "name": "User One", "is_verified": True},
            {"user_id": 10, "handle": "artist", "name": "Artist", "is_verified": True},
        ],
    }

    with app.app_context():
        db = get_db()
        populate_mock_db(db, entities)

        response = get_track_comments({"sort_method": "newest"}, 1)

        # Check that the response has the expected structure
        assert "data" in response
        assert "related" in response
        assert "users" in response["related"]
        assert "tracks" in response["related"]

        # Check that the comments are in the data field
        comments = response["data"]
        assert len(comments) == 1

        # Check that the related field contains the expected users
        users = response["related"]["users"]
        assert len(users) >= 1  # At least the comment author

        # Find the comment author in the related users
        user_id = decode_string_id(comments[0]["user_id"])
        found_user = False
        for user in users:
            if decode_string_id(user["id"]) == user_id:
                found_user = True
                # Check for full user object fields
                assert user["handle"] == "user1"
                assert "id" in user
                assert "user_id" in user
                assert "erc_wallet" in user
                assert user["name"] == "User One"
                assert user["is_verified"] == True
                break
        assert found_user, "Comment author not found in related users"

        # Check that the related field contains the expected tracks
        tracks = response["related"]["tracks"]
        assert len(tracks) >= 1  # At least the track being commented on

        # Find the track in the related tracks
        entity_id = decode_string_id(comments[0]["entity_id"])
        found_track = False
        for track in tracks:
            if decode_string_id(track["id"]) == entity_id:
                found_track = True
                # Check for full track object fields
                assert track["title"] == "Test Track"
                assert "id" in track
                assert "user_id" in track
                assert "user" in track
                assert decode_string_id(track["user_id"]) == 10  # Artist ID
                break
        assert found_track, "Track not found in related tracks"

        # Check that comments don't have their own related field
        for comment in comments:
            assert "related" not in comment

        # Also check that replies don't have their own related field
        if (
            len(comments) > 0
            and "replies" in comments[0]
            and len(comments[0]["replies"]) > 0
        ):
            for reply in comments[0]["replies"]:
                assert "related" not in reply


def test_get_comment_replies_related_field(app):
    """Test that the related field is included in the replies response"""
    entities = {
        "comments": [
            {
                "comment_id": 1,
                "user_id": 1,
                "entity_id": 1,
                "entity_type": "Track",
                "created_at": datetime(2022, 1, 1),
                "track_timestamp_s": 1,
                "text": "Parent comment",
            },
            {
                "comment_id": 2,
                "user_id": 2,
                "entity_id": 1,
                "entity_type": "Track",
                "created_at": datetime(2022, 1, 2),
                "track_timestamp_s": 2,
                "text": "Reply comment",
            },
        ],
        "comment_threads": [{"parent_comment_id": 1, "comment_id": 2}],
        "tracks": [
            {
                "track_id": 1,
                "title": "Test Track",
                "owner_id": 10,
            }
        ],
        "users": [
            {"user_id": 1, "handle": "user1", "name": "User One", "is_verified": True},
            {"user_id": 2, "handle": "user2", "name": "User Two", "is_verified": False},
            {"user_id": 10, "handle": "artist", "name": "Artist", "is_verified": True},
        ],
    }

    with app.app_context():
        db = get_db()
        populate_mock_db(db, entities)

        response = get_paginated_replies(
            {"limit": 10, "offset": 0, "sort_method": "newest"}, 1
        )

        # Check that the response has the expected structure
        assert "data" in response
        assert "related" in response
        assert "users" in response["related"]
        assert "tracks" in response["related"]

        # Check that the replies are in the data field
        replies = response["data"]
        assert len(replies) == 1

        # Check that the related field contains the expected users
        users = response["related"]["users"]
        assert len(users) >= 1  # At least the reply author

        # Find the reply author in the related users
        user_id = decode_string_id(replies[0]["user_id"])
        found_user = False
        for user in users:
            if decode_string_id(user["id"]) == user_id:
                found_user = True
                # Check for full user object fields
                assert user["handle"] == "user2"
                assert "id" in user
                assert "user_id" in user
                assert "erc_wallet" in user
                assert user["name"] == "User Two"
                assert user["is_verified"] == False
                break
        assert found_user, "Reply author not found in related users"

        # Check that the related field contains the expected tracks
        tracks = response["related"]["tracks"]
        assert len(tracks) >= 1  # At least the track being commented on

        # Find the track in the related tracks
        entity_id = decode_string_id(replies[0]["entity_id"])
        found_track = False
        for track in tracks:
            if decode_string_id(track["id"]) == entity_id:
                found_track = True
                # Check for full track object fields
                assert track["title"] == "Test Track"
                assert "id" in track
                assert "user_id" in track
                assert "user" in track
                assert decode_string_id(track["user_id"]) == 10  # Artist ID
                break
        assert found_track, "Track not found in related tracks"

        # Check that replies don't have their own related field
        for reply in replies:
            assert "related" not in reply
