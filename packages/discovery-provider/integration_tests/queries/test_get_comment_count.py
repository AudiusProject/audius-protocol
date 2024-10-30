import logging
from datetime import datetime

from integration_tests.utils import populate_mock_db
from src.models.comments.comment_report import COMMENT_KARMA_THRESHOLD
from src.queries.get_track_comment_count import get_track_comment_count
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


def test_get_comment_count_default(app):
    """Test get_track_comment_count function - tests default case (no reports/mutes/deletes)"""
    with app.app_context():
        db = get_db()

        entities = {
            "tracks": [{"track_id": 1, "owner_id": 1}],
            "users": [{"user_id": 1}, {"user_id": 2}, {"user_id": 3}, {"user_id": 4}],
            "comments": [
                {"comment_id": 1, "user_id": 2, "entity_id": 1, "entity_type": "Track"},
                {"comment_id": 2, "user_id": 3, "entity_id": 1, "entity_type": "Track"},
                {"comment_id": 3, "user_id": 4, "entity_id": 1, "entity_type": "Track"},
            ],
        }
        populate_mock_db(db, entities)

        # Check count for a user
        count = get_track_comment_count(1, 1)
        assert count == 3

        # Check count for anonymous user
        count = get_track_comment_count(1, None)
        assert count == 3


def test_get_comment_count_user_reported_comment(app):
    """Test get_track_comment_count function - tests that we don't count comments reported by the user"""
    with app.app_context():
        db = get_db()

        entities = {
            "tracks": [{"track_id": 1, "owner_id": 1}],
            "users": [{"user_id": 1}, {"user_id": 2}, {"user_id": 3}, {"user_id": 4}],
            "comments": [
                {"comment_id": 1, "user_id": 2, "entity_id": 1, "entity_type": "Track"},
                {"comment_id": 2, "user_id": 3, "entity_id": 1, "entity_type": "Track"},
                {"comment_id": 3, "user_id": 4, "entity_id": 1, "entity_type": "Track"},
            ],
            "comment_reports": [
                {"comment_id": 1, "user_id": 2},  # Reported by track owner
            ],
        }
        populate_mock_db(db, entities)

        # Check count for user that reported the comment
        count = get_track_comment_count(1, 2)
        assert count == 2

        # Check count for track owner - should see all comments
        count = get_track_comment_count(1, 1)
        assert count == 3

        # Check count for anonymous user - should see all comments
        count = get_track_comment_count(1, None)
        assert count == 3


def test_get_comment_count_artist_reported_comment(app):
    """Test get_track_comment_count function - tests that we don't count comments reported by the track owner"""
    with app.app_context():
        db = get_db()

        entities = {
            "tracks": [{"track_id": 1, "owner_id": 1}],
            "users": [{"user_id": 1}, {"user_id": 2}, {"user_id": 3}, {"user_id": 4}],
            "comments": [
                {"comment_id": 1, "user_id": 2, "entity_id": 1, "entity_type": "Track"},
                {"comment_id": 2, "user_id": 3, "entity_id": 1, "entity_type": "Track"},
                {"comment_id": 3, "user_id": 4, "entity_id": 1, "entity_type": "Track"},
            ],
            "comment_reports": [
                {"comment_id": 1, "user_id": 1},  # Reported by track owner
            ],
        }
        populate_mock_db(db, entities)
        # Check count for anonymous user
        count = get_track_comment_count(1, None)
        assert count == 2

        # Check count for track owner
        count_owner = get_track_comment_count(1, 1)
        assert count_owner == 2

        # Check count for user 3
        count_user3 = get_track_comment_count(1, 3)
        assert count_user3 == 2


def test_get_comment_count_with_karma_reported_comment(app):
    """Test get_track_comment_count function - tests that we don't count comments reported by a high-karma user"""
    with app.app_context():
        db = get_db()
        entities = {
            "aggregate_user": [
                {"user_id": 2, "follower_count": COMMENT_KARMA_THRESHOLD}
            ],
            "tracks": [{"track_id": 1, "owner_id": 1}],
            "users": [{"user_id": 1}, {"user_id": 2}, {"user_id": 3}, {"user_id": 4}],
            "comments": [
                {"comment_id": 1, "user_id": 2, "entity_id": 1, "entity_type": "Track"},
                {"comment_id": 2, "user_id": 3, "entity_id": 1, "entity_type": "Track"},
                {"comment_id": 3, "user_id": 4, "entity_id": 1, "entity_type": "Track"},
            ],
            "comment_reports": [
                {"comment_id": 2, "user_id": 2},  # Reported by god-mode user
            ],
        }

        # Check count for anonymous user
        populate_mock_db(db, entities)
        count = get_track_comment_count(1, None)
        assert count == 2

        # Check count for user 1 (track owner)
        count_user1 = get_track_comment_count(1, 1)
        assert count_user1 == 2

        # Check count for user 2 (high karma user who reported)
        count_user2 = get_track_comment_count(1, 2)
        assert count_user2 == 2


def test_get_comment_count_deleted_comment(app):
    """Test get_track_comment_count function - tests that a deleted comment is not counted"""
    with app.app_context():
        db = get_db()
        entities = {
            "tracks": [{"track_id": 1, "owner_id": 1}],
            "users": [{"user_id": 1}, {"user_id": 2}, {"user_id": 3}, {"user_id": 4}],
            "comments": [
                {"comment_id": 1, "user_id": 2, "entity_id": 1, "entity_type": "Track"},
                {
                    "comment_id": 2,
                    "user_id": 3,
                    "entity_id": 1,
                    "entity_type": "Track",
                    "is_delete": True,
                },
                {"comment_id": 3, "user_id": 4, "entity_id": 1, "entity_type": "Track"},
            ],
        }

        populate_mock_db(db, entities)
        count = get_track_comment_count(1, None)
        assert count == 2


def test_get_comment_count_muted_user(app):
    """Test get_track_comment_count function - tests that a muted user's comments are not counted for the muting user"""
    with app.app_context():
        db = get_db()
        entities = {
            "tracks": [{"track_id": 1, "owner_id": 1}],
            "users": [{"user_id": 1}, {"user_id": 2}, {"user_id": 3}, {"user_id": 4}],
            "comments": [
                {"comment_id": 1, "user_id": 2, "entity_id": 1, "entity_type": "Track"},
                {"comment_id": 2, "user_id": 3, "entity_id": 1, "entity_type": "Track"},
                {"comment_id": 3, "user_id": 3, "entity_id": 1, "entity_type": "Track"},
            ],
            "muted_users": [{"user_id": 2, "muted_user_id": 3}],  # User 1 mutes user 3
        }

        populate_mock_db(db, entities)
        # For user 2 who muted user 3, should only see 1 comments
        count = get_track_comment_count(1, 2)
        assert count == 1

        # For user 1 who hasn't muted anyone, should see all 3 comments
        count = get_track_comment_count(1, 1)
        assert count == 3

        # Anonymous user should see all 3 comments
        count = get_track_comment_count(1, None)
        assert count == 3


def test_get_comment_count_artist_muted_user(app):
    """Test get_track_comment_count function - tests that when an artist mutes someone, their comments are not counted for everyone"""
    with app.app_context():
        db = get_db()
        entities = {
            "tracks": [{"track_id": 1, "owner_id": 1}],
            "users": [
                {"user_id": 1},  # Artist
                {"user_id": 2},  # Muted user
                {"user_id": 3},  # Regular user
                {"user_id": 4},  # Another regular user
            ],
            "comments": [
                {  # muted comment
                    "comment_id": 1,
                    "user_id": 2,
                    "entity_id": 1,
                    "entity_type": "Track",
                },
                {  # muted comment
                    "comment_id": 2,
                    "user_id": 2,
                    "entity_id": 1,
                    "entity_type": "Track",
                },
                {  # regular comment
                    "comment_id": 3,
                    "user_id": 4,
                    "entity_id": 1,
                    "entity_type": "Track",
                },
            ],
            "muted_users": [
                # Artist (user 1) mutes user 2
                {"user_id": 1, "muted_user_id": 2}
            ],
        }

        populate_mock_db(db, entities)

        # The artist who muted should only see 1 comment
        count = get_track_comment_count(1, 1)
        assert count == 1

        # User 3 should also only see 1 comment
        count = get_track_comment_count(1, 3)
        assert count == 1

        # Anonymous user should also only see 1 comment
        count = get_track_comment_count(1, None)
        assert count == 1

        # Muted user should still see their own comments
        count = get_track_comment_count(1, 2)
        assert count == 3


def test_get_comment_count_high_karma_muted_user(app):
    """Test get_track_comment_count function - tests that when a high karma user mutes someone, their comments are hidden for everyone"""
    with app.app_context():
        db = get_db()
        entities = {
            "tracks": [{"track_id": 1, "owner_id": 1}],
            "users": [
                {"user_id": 1},  # Track artist
                {"user_id": 2},  # Muted user
                {"user_id": 3},  # High karma user
                {"user_id": 4},  # Regular user
            ],
            "comments": [
                {  # muted comment
                    "comment_id": 1,
                    "user_id": 2,
                    "entity_id": 1,
                    "entity_type": "Track",
                },
                {  # muted comment
                    "comment_id": 2,
                    "user_id": 2,
                    "entity_id": 1,
                    "entity_type": "Track",
                },
                {  # regular comment
                    "comment_id": 3,
                    "user_id": 4,
                    "entity_id": 1,
                    "entity_type": "Track",
                },
            ],
            "muted_users": [
                # High karma user 3 mutes user 2
                {"user_id": 3, "muted_user_id": 2}
            ],
            "aggregate_user": [
                # User 3 has high karma
                {"user_id": 3, "follower_count": COMMENT_KARMA_THRESHOLD + 1}
            ],
        }

        populate_mock_db(db, entities)

        # Track owner should only see 1 comment
        count = get_track_comment_count(1, 1)
        assert count == 1

        # High karma user should only see 1 comment
        count = get_track_comment_count(1, 3)
        assert count == 1

        # Anonymous user should only see 1 comment
        count = get_track_comment_count(1, None)
        assert count == 1

        # Muted user should still see their own comments
        count = get_track_comment_count(1, 2)
        assert count == 3
