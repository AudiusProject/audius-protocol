import logging
from datetime import datetime, timedelta
from typing import List

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


# ========================================== Start Tests ==========================================
def test_track_remix_notification(app):
    with app.app_context():
        db = get_db()
    track_created_at = datetime.now()
    # Insert a track with remix_of and check that a notificaiton is created for the track remix owner
    entities = {
        "users": [{"user_id": 1}, {"user_id": 2}],
        "tracks": [
            {"track_id": 20, "owner_id": 1},
            {
                "track_id": 100,
                "owner_id": 2,
                "remix_of": {
                    "tracks": [{"parent_track_id": 20}],
                },
            },
            # user should not receive notification of an update to this track remix row
            {
                "track_id": 100,
                "owner_id": 2,
                "created_at": track_created_at,
                "updated_at": track_created_at + timedelta(days=1),
                "remix_of": {
                    "tracks": [{"parent_track_id": 20}],
                },
            },
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        notifications: List[Notification] = session.query(Notification).all()
        assert len(notifications) == 1
        notification = notifications[0]
        assert notification.specifier == "2"
        assert notification.group_id == "remix:track:100:parent_track:20:blocknumber:1"
        assert notification.type == "remix"
        assert notification.slot == None
        assert notification.blocknumber == 1
        assert notification.data == {
            "parent_track_id": 20,
            "track_id": 100,
        }
        assert notification.user_ids == [1]


def test_track_create_notification_on_track_update(app):
    with app.app_context():
        db = get_db()

    entities = {
        "users": [{"user_id": i + 1} for i in range(5)],
        "subscriptions": [{"subscriber_id": i, "user_id": 1} for i in range(1, 5)],
    }
    populate_mock_db(db, entities)
    track_20_creation_datetime = datetime.now()
    entities = {
        "tracks": [
            {
                "track_id": 20,
                "owner_id": 1,
                "created_at": track_20_creation_datetime,
                "updated_at": track_20_creation_datetime + timedelta(days=1),
            },
            {"track_id": 21, "owner_id": 1, "is_playlist_upload": True},
            {"track_id": 2, "owner_id": 2},
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        notifications: List[Notification] = (
            session.query(Notification).filter(Notification.type == "create").all()
        )
        assert len(notifications) == 0


def test_track_create_notification_on_track_creation(app):
    with app.app_context():
        db = get_db()

    entities = {
        "users": [{"user_id": i + 1} for i in range(5)],
        "subscriptions": [{"subscriber_id": i, "user_id": 1} for i in range(1, 5)],
    }
    populate_mock_db(db, entities)
    entities = {
        "tracks": [
            {"track_id": 20, "owner_id": 1},
            {"track_id": 20, "owner_id": 1},
            {"track_id": 21, "owner_id": 1, "is_playlist_upload": True},
            {"track_id": 2, "owner_id": 2},
        ],
    }
    populate_mock_db(db, entities)
    populate_mock_db(db, {"tracks": [{"track_id": 20, "title": "new title"}]})

    with db.scoped_session() as session:
        notifications: List[Notification] = (
            session.query(Notification).filter(Notification.type == "create").all()
        )
        assert len(notifications) == 1
        notification = notifications[0]
        assert notification.specifier == "20"
        assert notification.group_id == "create:track:user_id:1"
        assert notification.type == "create"
        assert notification.slot == None
        assert notification.data == {
            "track_id": 20,
        }
        assert notification.user_ids == list(range(1, 5))


def test_track_create_notification_on_track_with_previous_specifier(app):
    # for context, when create notifications were first added, they
    # used track owner id as the specifier. specifier was later
    # switched to track id, which led to a weird edge case:
    # a track was created before this specifier change,
    # creating a notification with the specifier as user id
    # after the specifier change, that same track was updated.
    # calling for an update to the previous track row marking is current is false,
    # and an insertion of a new track row with is current as true.
    # the update action would hit the handle_tracks trigger first,
    # creating a notification for that row that is no longer current,
    # resulting in a notification with old timestamp and slot number,
    # and an unnecessary push notification for a track that has already been created.
    with app.app_context():
        db = get_db()

    entities = {
        "users": [{"user_id": i + 1} for i in range(6)],
        "subscriptions": [{"subscriber_id": i, "user_id": 1} for i in range(1, 5)],
    }
    populate_mock_db(db, entities)
    track20_created_at = datetime.now()
    entities = {
        "tracks": [
            {
                "track_id": 20,
                "owner_id": 1,
                "created_at": track20_created_at,
                "updated_at": track20_created_at,
            },
        ]
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        session.query(Notification).filter(Notification.specifier == "20").update(
            {"specifier": "1"}
        )

    entities = {
        "tracks": [
            {
                "track_id": 20,
                "title": "new title",
                "blocknumber": 32,
                "created_at": track20_created_at,
                "updated_at": track20_created_at + timedelta(days=1),
            },
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        notifications: List[Notification] = (
            session.query(Notification).filter(Notification.type == "create").all()
        )
        assert len(notifications) == 1
        notification = notifications[0]
        assert notification.specifier == "1"
        assert notification.group_id == "create:track:user_id:1"
        assert notification.type == "create"
        assert notification.slot == None
        assert notification.data == {
            "track_id": 20,
        }
        assert notification.user_ids == list(range(1, 5))
