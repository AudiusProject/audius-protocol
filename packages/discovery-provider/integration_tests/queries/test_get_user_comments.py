import logging
from datetime import datetime

from integration_tests.utils import populate_mock_db
from src.models.comments.comment_report import COMMENT_KARMA_THRESHOLD
from src.queries.comments import COMMENT_ROOT_DEFAULT_LIMIT, get_user_comments
from src.utils.db_session import get_db
from src.utils.helpers import decode_string_id

logger = logging.getLogger(__name__)

# Test data for user comments
test_entities = {
    "comments": [
        {  # User 1's comments
            "comment_id": i,
            "user_id": 1,
            "entity_id": i,  # Different tracks
            "entity_type": "Track",
            "text": f"User 1 comment {i}",
            "created_at": datetime(2022, 1, i),
            "updated_at": datetime(2022, 1, i),
            "is_edited": i == 10,
            "track_timestamp_s": i,
        }
        for i in range(1, 20)
    ]
    + [
        {  # User 2's comments
            "comment_id": i + 100,
            "user_id": 2,
            "entity_id": 1,  # All on the same track
            "entity_type": "Track",
            "text": f"User 2 comment {i}",
            "created_at": datetime(2022, 2, i),
            "updated_at": datetime(2022, 2, i),
            "track_timestamp_s": i,
        }
        for i in range(1, 11)
    ],
    "comment_reactions": [
        {
            "comment_id": 5,
            "user_id": 2,
            "is_delete": False,
        },  # User 2 reacted to User 1's comment
        {
            "comment_id": 105,
            "user_id": 1,
            "is_delete": False,
        },  # User 1 reacted to User 2's comment
    ],
    "tracks": [
        {
            "track_id": i,
            "title": f"Track {i}",
            "owner_id": 10,
        }
        for i in range(1, 20)
    ],
    "users": [
        {"user_id": 1, "handle": "user1"},
        {"user_id": 2, "handle": "user2"},
        {"user_id": 10, "handle": "artist"},
    ],
    "comment_mentions": [
        {"comment_id": 5, "user_id": 2},  # User 1 mentioned User 2
        {"comment_id": 5, "user_id": 10},  # User 1 mentioned the artist
        {"comment_id": 105, "user_id": 1},  # User 2 mentioned User 1
    ],
}


def test_get_user_comments_default(app):
    """Test getting user comments with default parameters"""
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)

        # Get User 1's comments
        args = {
            "user_id": 1,
            "current_user_id": 2,
            "sort_method": "newest",
        }
        response = get_user_comments(args)

        # Check that the response has the expected structure
        assert "data" in response

        # Get the comments from the data field
        comments = response["data"]
        assert len(comments) == COMMENT_ROOT_DEFAULT_LIMIT
        for comment in comments:
            # Verify these are User 1's comments
            assert decode_string_id(comment["user_id"]) == 1

            # Check if the specific comment with reactions is properly marked
            if decode_string_id(comment["id"]) == 5:
                assert comment["react_count"] == 1
                assert comment["is_current_user_reacted"] == True

            # Check if mentions are properly included
            if decode_string_id(comment["id"]) == 5:
                assert len(comment["mentions"]) == 2
                assert any(m["handle"] == "user2" for m in comment["mentions"])
                assert any(m["handle"] == "artist" for m in comment["mentions"])


def test_get_user_comments_pagination(app):
    """Test pagination of user comments"""
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)

        # Get User 1's comments with pagination
        args = {
            "user_id": 1,
            "current_user_id": 2,
            "limit": 5,
            "offset": 5,
        }
        response = get_user_comments(args)

        # Get the comments from the data field
        comments = response["data"]
        assert len(comments) == 5
        # Since we're ordering by created_at DESC, we should get comments 14-10
        comment_ids = [decode_string_id(comment["id"]) for comment in comments]
        assert all(10 <= comment_id <= 14 for comment_id in comment_ids)


def test_get_user_comments_different_users(app):
    """Test getting comments for different users"""
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)

        # Get User 2's comments
        args = {
            "user_id": 2,
            "current_user_id": 1,
        }
        response = get_user_comments(args)

        # Get the comments from the data field
        comments = response["data"]
        assert len(comments) == 10  # User 2 has 10 comments
        for comment in comments:
            # Verify these are User 2's comments
            assert decode_string_id(comment["user_id"]) == 2

            # Check if the specific comment with reactions is properly marked
            if decode_string_id(comment["id"]) == 105:
                assert comment["react_count"] == 1
                assert comment["is_current_user_reacted"] == True
                assert len(comment["mentions"]) == 1
                assert comment["mentions"][0]["handle"] == "user1"


def test_get_user_comments_deleted(app):
    """Test that deleted comments are not returned"""
    entities = {
        "comments": [
            {
                "comment_id": 1,
                "user_id": 1,
                "entity_id": 1,
                "entity_type": "Track",
                "text": "Normal comment",
                "created_at": datetime(2022, 1, 1),
                "updated_at": datetime(2022, 1, 1),
            },
            {
                "comment_id": 2,
                "user_id": 1,
                "entity_id": 1,
                "entity_type": "Track",
                "text": "Deleted comment",
                "created_at": datetime(2022, 1, 2),
                "updated_at": datetime(2022, 1, 2),
                "is_delete": True,
            },
        ],
        "tracks": [{"track_id": 1, "owner_id": 10}],
        "users": [{"user_id": 1}, {"user_id": 10}],
    }

    with app.app_context():
        db = get_db()
        populate_mock_db(db, entities)

        args = {
            "user_id": 1,
            "current_user_id": 10,
        }
        response = get_user_comments(args)

        # Get the comments from the data field
        comments = response["data"]
        # Only the normal comment should be returned
        assert len(comments) == 1
        assert decode_string_id(comments[0]["id"]) == 1


def test_get_user_comments_muted(app):
    """Test that muted users' comments are not returned"""
    entities = {
        "comments": [
            {
                "comment_id": 1,
                "user_id": 1,
                "entity_id": 1,
                "entity_type": "Track",
                "text": "Normal comment",
                "created_at": datetime(2022, 1, 1),
                "updated_at": datetime(2022, 1, 1),
            },
            {
                "comment_id": 2,
                "user_id": 2,
                "entity_id": 1,
                "entity_type": "Track",
                "text": "Muted user comment",
                "created_at": datetime(2022, 1, 2),
                "updated_at": datetime(2022, 1, 2),
            },
        ],
        "muted_users": [{"user_id": 10, "muted_user_id": 2}],  # User 10 muted User 2
        "tracks": [{"track_id": 1, "owner_id": 5}],
        "users": [
            {"user_id": 1, "handle": "user1"},
            {"user_id": 2, "handle": "user2"},
            {"user_id": 5, "handle": "artist"},
            {"user_id": 10, "handle": "viewer"},
        ],
    }

    with app.app_context():
        db = get_db()
        populate_mock_db(db, entities)

        # When viewed by user 10 who muted user 2
        args = {
            "user_id": 2,
            "current_user_id": 10,
        }
        response = get_user_comments(args)

        # Get the comments from the data field
        comments = response["data"]
        # User 2's comment should not be visible to user 10
        assert len(comments) == 0

        # But user 1's comments should be visible to user 10
        args = {
            "user_id": 1,
            "current_user_id": 10,
        }
        response = get_user_comments(args)

        # Get the comments from the data field
        comments = response["data"]
        assert len(comments) == 1


def test_get_user_comments_reported(app):
    """Test that comments with too many reports are not returned"""
    entities = {
        "comments": [
            {
                "comment_id": 1,
                "user_id": 1,
                "entity_id": 1,
                "entity_type": "Track",
                "text": "Normal comment",
                "created_at": datetime(2022, 1, 1),
                "updated_at": datetime(2022, 1, 1),
            },
            {
                "comment_id": 2,
                "user_id": 1,
                "entity_id": 1,
                "entity_type": "Track",
                "text": "Heavily reported comment",
                "created_at": datetime(2022, 1, 2),
                "updated_at": datetime(2022, 1, 2),
            },
        ],
        "aggregate_user": [
            {
                "user_id": 5,
                "follower_count": COMMENT_KARMA_THRESHOLD,
            },  # Artist with many followers
        ],
        "comment_reports": [
            {"comment_id": 2, "user_id": 5},  # Artist reported comment 2
            {"comment_id": 2, "user_id": 10},  # User 10 reported comment 2
        ],
        "tracks": [{"track_id": 1, "owner_id": 5}],
        "users": [
            {"user_id": 1, "handle": "user1"},
            {"user_id": 5, "handle": "artist"},
            {"user_id": 10, "handle": "viewer"},
        ],
    }

    with app.app_context():
        db = get_db()
        populate_mock_db(db, entities)

        args = {
            "user_id": 1,
            "current_user_id": 20,  # A different user viewing
        }
        response = get_user_comments(args)

        # Get the comments from the data field
        comments = response["data"]

        # Only the normal comment should be returned, not the heavily reported one
        assert len(comments) == 1
        assert decode_string_id(comments[0]["id"]) == 1


def test_get_user_comments_edited(app):
    """Test that edited flag is properly set"""
    entities = {
        "comments": [
            {
                "comment_id": 1,
                "user_id": 1,
                "entity_id": 1,
                "entity_type": "Track",
                "text": "Normal comment",
                "created_at": datetime(2022, 1, 1),
                "updated_at": datetime(2022, 1, 1),
                "is_edited": False,
            },
            {
                "comment_id": 2,
                "user_id": 1,
                "entity_id": 1,
                "entity_type": "Track",
                "text": "Edited comment",
                "created_at": datetime(2022, 1, 2),
                "updated_at": datetime(2022, 1, 3),  # Updated later
                "is_edited": True,
            },
        ],
        "tracks": [{"track_id": 1, "owner_id": 10}],
        "users": [{"user_id": 1}, {"user_id": 10}],
    }

    with app.app_context():
        db = get_db()
        populate_mock_db(db, entities)

        args = {
            "user_id": 1,
            "current_user_id": 10,
        }
        response = get_user_comments(args)

        # Get the comments from the data field
        comments = response["data"]

        assert len(comments) == 2

        # Find the edited comment
        edited_comment = next(c for c in comments if decode_string_id(c["id"]) == 2)
        assert edited_comment["is_edited"] == True

        # Find the normal comment
        normal_comment = next(c for c in comments if decode_string_id(c["id"]) == 1)
        assert normal_comment["is_edited"] == False


def test_get_user_comments_unlisted_tracks(app):
    """Test that comments on unlisted tracks are not returned"""
    entities = {
        "comments": [
            {
                "comment_id": 1,
                "user_id": 1,
                "entity_id": 1,
                "entity_type": "Track",
                "text": "Comment on public track",
                "created_at": datetime(2022, 1, 1),
                "updated_at": datetime(2022, 1, 1),
            },
            {
                "comment_id": 2,
                "user_id": 1,
                "entity_id": 2,
                "entity_type": "Track",
                "text": "Comment on unlisted track",
                "created_at": datetime(2022, 1, 2),
                "updated_at": datetime(2022, 1, 2),
            },
        ],
        "tracks": [
            {
                "track_id": 1,
                "owner_id": 10,
                "is_current": True,
                "is_unlisted": False,
                "title": "Public Track",
            },
            {
                "track_id": 2,
                "owner_id": 10,
                "is_current": True,
                "is_unlisted": True,
                "title": "Unlisted Track",
            },
        ],
        "users": [
            {"user_id": 1, "handle": "user1"},
            {"user_id": 10, "handle": "artist"},
        ],
    }

    with app.app_context():
        db = get_db()
        populate_mock_db(db, entities)

        args = {
            "user_id": 1,
            "current_user_id": 10,
        }
        response = get_user_comments(args)

        # Get the comments from the data field
        comments = response["data"]

        # Only the comment on the public track should be returned
        assert len(comments) == 1
        assert decode_string_id(comments[0]["id"]) == 1

        # Verify the comment on the unlisted track is not included
        unlisted_comments = [c for c in comments if decode_string_id(c["id"]) == 2]
        assert len(unlisted_comments) == 0


def test_get_user_comments_related_field(app):
    """Test that the related field is included in the response and contains the expected user and track information"""
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)

        # Get User 1's comments
        args = {
            "user_id": 1,
            "current_user_id": 2,
            "sort_method": "newest",
        }
        response = get_user_comments(args, include_related=True)

        # Check that the response has the expected structure
        assert "data" in response
        assert "related" in response
        assert "users" in response["related"]
        assert "tracks" in response["related"]

        # Get the comments from the data field
        comments = response["data"]

        # Check that the related field contains the expected users
        users = response["related"]["users"]
        assert len(users) >= 1  # At least the comment author

        # Find the comment author in the related users
        user_id = decode_string_id(comments[0]["user_id"])
        found_user = False
        for user in users:
            if user["user_id"] == user_id:
                found_user = True
                # Check for full user object fields
                assert user["handle"] == "user1"
                assert "user_id" in user
                break
        assert found_user, "Comment author not found in related users"

        # Check that the related field contains the expected tracks
        tracks = response["related"]["tracks"]
        assert len(tracks) >= 1  # At least one track

        # Find a track in the related tracks
        entity_id = decode_string_id(comments[0]["entity_id"])
        found_track = False
        for track in tracks:
            if track["track_id"] == entity_id:
                found_track = True
                # Check for full track object fields
                assert track["title"] == f"Track {entity_id}"
                assert "owner_id" in track
                assert "user" in track
                assert track["owner_id"] == 10  # Artist ID
                break
        assert found_track, "Track not found in related tracks"

        # Check that comments don't have their own related field
        for comment in comments:
            assert "related" not in comment
