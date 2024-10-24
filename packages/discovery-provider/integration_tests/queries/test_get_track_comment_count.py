import logging

from integration_tests.utils import populate_mock_db
from src.models.comments.comment_report import COMMENT_KARMA_THRESHOLD
from src.queries.get_track_comment_count import get_track_comment_count
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


def test_get_track_without_comments(app):
    """Test get_track_comment_count function for a track with no comments"""
    with app.app_context():
        db = get_db()
        entities = {
            "tracks": [{"track_id": 1, "owner_id": 1}],
            "users": [{"user_id": 1}],
        }
        populate_mock_db(db, entities)
        count = get_track_comment_count(1, 1)
        assert count == 0


def test_get_track_with_comments(app):
    """Test get_track_comment_count function for a track with 2 comments"""
    with app.app_context():
        db = get_db()
        entities = {
            "tracks": [{"track_id": 1, "owner_id": 1}],
            "users": [{"user_id": 1}, {"user_id": 2}, {"user_id": 3}],
            "comments": [
                {"comment_id": 1, "user_id": 2, "entity_id": 1, "entity_type": "Track"},
                {"comment_id": 2, "user_id": 3, "entity_id": 1, "entity_type": "Track"},
            ],
        }
        populate_mock_db(db, entities)
        count = get_track_comment_count(1, None)
        assert count == 2


def test_get_track_with_reported_comment(app):
    """Test get_track_comment_count function for a track with 2 comments, one reported by track owner"""
    with app.app_context():
        db = get_db()
        entities = {
            "tracks": [{"track_id": 1, "owner_id": 1}],
            "users": [{"user_id": 1}, {"user_id": 2}, {"user_id": 3}],
            "comments": [
                {"comment_id": 1, "user_id": 2, "entity_id": 1, "entity_type": "Track"},
                {"comment_id": 2, "user_id": 3, "entity_id": 1, "entity_type": "Track"},
            ],
            "comment_reports": [
                {"comment_id": 1, "user_id": 1},  # Reported by track owner
            ],
        }
        populate_mock_db(db, entities)
        count = get_track_comment_count(1, None)
        assert count == 1


def test_get_track_with_muted_commenter(app):
    """Test get_track_comment_count function for a track with 2 comments, one commenter muted by track owner"""
    with app.app_context():
        db = get_db()
        initial_entities = {
            "aggregate_user": [
                {"user_id": 1, "follower_count": COMMENT_KARMA_THRESHOLD + 1},
            ]
        }
        populate_mock_db(db, initial_entities)
        entities = {
            "tracks": [{"track_id": 1, "owner_id": 1}],
            "comments": [
                {"comment_id": 1, "user_id": 2, "entity_id": 1, "entity_type": "Track"},
                {"comment_id": 2, "user_id": 3, "entity_id": 1, "entity_type": "Track"},
            ],
            "muted_users": [
                {"user_id": 1, "muted_user_id": 2},  # Track owner muted user 2
            ],
        }
        populate_mock_db(db, entities)
        count = get_track_comment_count(1, None)  # Pass track owner's user_id
        assert count == 1
