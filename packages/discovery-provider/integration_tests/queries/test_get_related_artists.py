import logging

from integration_tests.utils import populate_mock_db
from src.queries.get_related_artists import get_related_artists
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)

def test_get_related_artists(app):
    """Test getting related artists based on genre similarity"""
    with app.app_context():
        db = get_db()

        test_entities = {
            "tracks": [
                # User 1's tracks - mostly Electronic
                {"track_id": 1, "owner_id": 1, "genre": "Electronic", "is_current": True, "is_delete": False, "is_unlisted": False, "is_available": True},
                {"track_id": 2, "owner_id": 1, "genre": "Electronic", "is_current": True, "is_delete": False, "is_unlisted": False, "is_available": True},
                {"track_id": 3, "owner_id": 1, "genre": "Pop", "is_current": True, "is_delete": False, "is_unlisted": False, "is_available": True},

                # User 2's tracks - only Electronic
                {"track_id": 4, "owner_id": 2, "genre": "Electronic", "is_current": True, "is_delete": False, "is_unlisted": False, "is_available": True},
                {"track_id": 5, "owner_id": 2, "genre": "Electronic", "is_current": True, "is_delete": False, "is_unlisted": False, "is_available": True},

                # User 3's tracks - only Pop
                {"track_id": 6, "owner_id": 3, "genre": "Pop", "is_current": True, "is_delete": False, "is_unlisted": False, "is_available": True},
                {"track_id": 7, "owner_id": 3, "genre": "Pop", "is_current": True, "is_delete": False, "is_unlisted": False, "is_available": True},

                # User 4's tracks - mix of genres
                {"track_id": 8, "owner_id": 4, "genre": "Electronic", "is_current": True, "is_delete": False, "is_unlisted": False, "is_available": True},
                {"track_id": 9, "owner_id": 4, "genre": "Pop", "is_current": True, "is_delete": False, "is_unlisted": False, "is_available": True},
            ],
            "users": [
                {"user_id": 1, "handle": "user1", "is_current": True},
                {"user_id": 2, "handle": "user2", "is_current": True},
                {"user_id": 3, "handle": "user3", "is_current": True},
                {"user_id": 4, "handle": "user4", "is_current": True},
            ],
            "follows": [
                {"follower_user_id": 1, "followee_user_id": 2, "is_current": True, "is_delete": False},  # User 1 follows User 2
            ],
            "aggregate_user": [
                {"user_id": 1, "follower_count": 100, "dominant_genre": "Electronic"},
                {"user_id": 2, "follower_count": 50, "dominant_genre": "Electronic"},  # Should be recommended (similar genre, lower follower count)
                {"user_id": 3, "follower_count": 400, "dominant_genre": "Pop"},  # Should not be recommended (too many followers)
                {"user_id": 4, "follower_count": 75, "dominant_genre": "Electronic"},  # Should be recommended
            ]
        }

        populate_mock_db(db, test_entities)

        # Test basic related artists functionality
        related = get_related_artists(1, None)
        assert len(related) == 2  # Should get users 2 and 4
        assert related[0]["user_id"] == 4  # User 2 should be first (same genre_rank but higher follower count)
        assert related[1]["user_id"] == 2  # User 4 should be second (same genre_rank but lower follower count)

        # Test with filter_followed=True and current_user_id
        related = get_related_artists(1, 1, filter_followed=True)
        assert len(related) == 1  # Should just be 4 since user 1 follows user 2
        user_ids = [user["user_id"] for user in related]
        assert 4 in user_ids
    
        # Test pagination
        related = get_related_artists(1, None, limit=1)
        assert len(related) == 1
        assert related[0]["user_id"] == 4  # First related artist should be user 2 (same genre_rank but lower follower count)

        related = get_related_artists(1, None, limit=1, offset=1)
        assert len(related) == 1
        assert related[0]["user_id"] == 2  # Second related artist should be user 4 (same genre_rank but higher follower count)

def test_get_related_artists_edge_cases(app):
    """Test edge cases for getting related artists"""
    with app.app_context():
        db = get_db()

        test_entities = {
            "tracks": [
                # User with no tracks (user 1)
                
                # User with deleted/unlisted tracks (user 2)
                {"track_id": 1, "owner_id": 2, "genre": "Electronic"},
                {"track_id": 2, "owner_id": 2, "genre": "Electronic"},

                # User with valid tracks (user 3)
                {"track_id": 3, "owner_id": 3, "genre": "Electronic"},
            ],
            "users": [
                {"user_id": 1, "handle": "user1"},
                {"user_id": 2, "handle": "user2"},
                {"user_id": 3, "handle": "user3"},
            ],
            "aggregate_user": [
                {"user_id": 1, "follower_count": 100, "dominant_genre": "Electronic"},
                {"user_id": 2, "follower_count": 50, "dominant_genre": "Electronic"},
                {"user_id": 3, "follower_count": 75, "dominant_genre": "Electronic"},
            ]
        }

        populate_mock_db(db, test_entities)

        # Test user with no tracks
        related = get_related_artists(1, None)
        assert len(related) == 0  # Should get no users since user 1 has no valid tracks to determine genre from

        # Test with non-existent user
        related = get_related_artists(999, None)
        assert len(related) == 0