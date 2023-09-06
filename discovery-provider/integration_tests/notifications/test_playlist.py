import logging
from datetime import datetime, timedelta
from typing import List

from sqlalchemy import asc

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


# ========================================== Start Tests ==========================================
def test_playlist_track_added_notification(app):
    """Tests that a repost notification is created on repost  correctly"""
    with app.app_context():
        db = get_db()

    # Insert Playlist with two new tracks and check that a notification is created for the track owners
    now = datetime.now()
    entities = {
        "tracks": [
            {"track_id": 20, "owner_id": 1},
            {"track_id": 10, "owner_id": 2},
            {"track_id": 30, "owner_id": 15},
            {"track_id": 40, "owner_id": 12},
        ],
        "playlists": [
            {
                "playlist_owner_id": 2,
                "created_at": now,
                "updated_at": now,
                "playlist_contents": {
                    "track_ids": [
                        {"time": datetime.timestamp(now), "track": 20},
                        {"time": datetime.timestamp(now), "track": 30},
                        {"time": datetime.timestamp(now), "track": 10},
                        {
                            "time": datetime.timestamp(now - timedelta(minutes=1)),
                            "track": 40,
                        },
                    ]
                },
            },
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        notifications: List[Notification] = (
            session.query(Notification).order_by(asc(Notification.specifier)).all()
        )
        assert len(notifications) == 2
        assert (
            notifications[0].group_id
            == "track_added_to_playlist:playlist_id:0:track_id:20"
        )
        assert notifications[0].specifier == "1"
        assert notifications[0].type == "track_added_to_playlist"
        assert notifications[0].slot == None
        assert notifications[0].blocknumber == 0
        assert notifications[0].data == {
            "track_id": 20,
            "playlist_id": 0,
            "playlist_owner_id": 2,
        }
        assert notifications[0].user_ids == [1]

        assert (
            notifications[1].group_id
            == "track_added_to_playlist:playlist_id:0:track_id:30"
        )
        assert notifications[1].specifier == "15"
        assert notifications[1].type == "track_added_to_playlist"
        assert notifications[1].slot == None
        assert notifications[1].blocknumber == 0
        assert notifications[1].data == {
            "track_id": 30,
            "playlist_id": 0,
            "playlist_owner_id": 2,
        }
        assert notifications[1].user_ids == [15]


# ========================================== Start Tests ==========================================
def test_playlist_create_notification(app):
    with app.app_context():
        db = get_db()

    # Insert Playlist with two new tracks and check that a notification is created for the track owners
    now = datetime.now()
    entities = {
        "users": [{"user_id": i + 1} for i in range(5)],
        "subscriptions": [{"subscriber_id": i, "user_id": 1} for i in range(1, 5)],
    }
    populate_mock_db(db, entities)

    entities = {
        "tracks": [
            {"track_id": 20, "owner_id": 1, "is_playlist_upload": True},
        ],
        "playlists": [
            {
                "playlist_id": 1,
                "playlist_owner_id": 1,
                "created_at": now,
                "updated_at": now,
                "playlist_contents": {
                    "track_ids": [
                        {"time": datetime.timestamp(now), "track": 20},
                    ]
                },
            },
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        notifications: List[Notification] = (
            session.query(Notification).filter(Notification.type == "create").all()
        )
        assert len(notifications) == 1
        assert notifications[0].group_id == "create:playlist_id:1"
        assert notifications[0].specifier == "1"
        assert notifications[0].type == "create"
        assert notifications[0].slot == None
        assert notifications[0].data == {"playlist_id": 1, "is_album": False}
        assert notifications[0].user_ids == list(range(1, 5))


def test_playlist_create_notification_on_playlist_update(app):
    with app.app_context():
        db = get_db()

    # Insert Playlist with two new tracks and check that a notification is created for the track owners
    now = datetime.now()
    entities = {
        "users": [{"user_id": i + 1} for i in range(5)],
        "subscriptions": [{"subscriber_id": i, "user_id": 1} for i in range(1, 5)],
    }
    populate_mock_db(db, entities)

    entities = {
        "tracks": [
            {"track_id": 20, "owner_id": 1, "is_playlist_upload": True},
        ],
        "playlists": [
            {
                "playlist_id": 1,
                "playlist_owner_id": 1,
                "created_at": now,
                "updated_at": now + timedelta(days=1),
                "playlist_contents": {
                    "track_ids": [
                        {"time": datetime.timestamp(now), "track": 20},
                    ]
                },
            },
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        notifications: List[Notification] = (
            session.query(Notification).filter(Notification.type == "create").all()
        )
        assert len(notifications) == 0
