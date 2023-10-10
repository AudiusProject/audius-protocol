import logging
from datetime import datetime

from integration_tests.utils import populate_mock_db
from src.queries.get_user_playlist_update import get_user_playlist_update
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


t1 = datetime.fromtimestamp(10000000)
t2 = datetime.fromtimestamp(10000001)
t3 = datetime.fromtimestamp(10000002)
t4 = datetime.fromtimestamp(10000003)


def test_user_playlist_update(app):
    """Tests that fetching updated playlists for users works"""
    with app.app_context():
        db = get_db()

        test_entities = {
            "playlists": [
                {"playlist_id": playlist_id, "updated_at": t2}
                for playlist_id in range(1, 20)
            ],
            "users": [{"user_id": user_id} for user_id in range(1, 20)],
            "saves": [
                {
                    "user_id": 1,
                    "save_item_id": 1,
                    "save_type": "playlist",
                    "created_at": t1,
                },
                {
                    "user_id": 1,
                    "save_item_id": 2,
                    "save_type": "playlist",
                    "created_at": t1,
                },
                {
                    "user_id": 1,
                    "save_item_id": 3,
                    "save_type": "playlist",
                    "created_at": t1,
                },
                {
                    "user_id": 1,
                    "save_item_id": 4,
                    "save_type": "playlist",
                    "created_at": t1,
                },
                {
                    "user_id": 2,
                    "save_item_id": 2,
                    "save_type": "playlist",
                    "created_at": t1,
                },
                {
                    "user_id": 3,
                    "save_item_id": 2,
                    "save_type": "playlist",
                    "created_at": t3,
                },
            ],
            "playlist_seens": [
                {"is_current": True, "user_id": 1, "playlist_id": 1, "seen_at": t1},
                {"is_current": True, "user_id": 1, "playlist_id": 2, "seen_at": t2},
                {"is_current": True, "user_id": 1, "playlist_id": 3, "seen_at": t3},
                {"is_current": True, "user_id": 1, "playlist_id": 4, "seen_at": t1},
            ],
        }

        populate_mock_db(db, test_entities)

        user_id = 1
        playlist_updates = get_user_playlist_update(user_id)
        assert playlist_updates == [
            {
                "playlist_id": 1,
                "updated_at": t2,
                "last_seen_at": t1,
            },
            {
                "playlist_id": 4,
                "updated_at": t2,
                "last_seen_at": t1,
            },
        ]

        user_id = 2
        playlist_updates = get_user_playlist_update(user_id)
        assert playlist_updates == [
            {
                "playlist_id": 2,
                "updated_at": t2,
                "last_seen_at": None,
            }
        ]

        user_id = 3
        playlist_updates = get_user_playlist_update(user_id)
        assert playlist_updates == []
