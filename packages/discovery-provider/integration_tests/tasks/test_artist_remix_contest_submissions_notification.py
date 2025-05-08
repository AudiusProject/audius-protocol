import logging
from datetime import datetime, timedelta

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.queries.get_notifications import NotificationType
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)

TEST_CONTEST_CREATOR_ID = 1
TEST_PARENT_TRACK_ID = 100
TEST_EVENT_ID = 200


def make_remix(track_id, owner_id, created_at):
    return {
        "track_id": track_id,
        "owner_id": owner_id,
        "is_current": True,
        "is_delete": False,
        "created_at": created_at,
        "updated_at": created_at,
        "remix_of": {"tracks": [{"parent_track_id": TEST_PARENT_TRACK_ID}]},
    }


def get_milestone_notifications(db):
    with db.scoped_session() as session:
        return (
            session.query(Notification)
            .filter(
                Notification.type == NotificationType.ARTIST_REMIX_CONTEST_SUBMISSIONS
            )
            .all()
        )


def test_artist_remix_contest_submissions_milestones(app):
    """Test that milestone notifications are created for 1, 10, 50 submissions after contest start"""
    with app.app_context():
        db = get_db()

    now = datetime.now()
    before = now - timedelta(days=1)

    # Insert contest creator and parent track
    entities = {
        "users": [
            {
                "user_id": TEST_CONTEST_CREATOR_ID,
                "is_current": True,
                "created_at": now,
                "updated_at": now,
            }
        ],
        "tracks": [
            {
                "track_id": TEST_PARENT_TRACK_ID,
                "owner_id": TEST_CONTEST_CREATOR_ID,
                "is_current": True,
                "is_delete": False,
                "created_at": now,
                "updated_at": now,
            }
        ],
    }
    populate_mock_db(db, entities)

    # Insert contest event
    event_entities = {
        "events": [
            {
                "event_id": TEST_EVENT_ID,
                "event_type": "remix_contest",
                "user_id": TEST_CONTEST_CREATOR_ID,
                "entity_id": TEST_PARENT_TRACK_ID,
                "entity_type": "track",
                "is_deleted": False,
                "created_at": now,
                "updated_at": now,
                "end_date": now + timedelta(days=7),
            }
        ]
    }
    populate_mock_db(db, event_entities)

    # Insert 1 remix before contest start (should not count)
    remix_entities = {"tracks": [make_remix(1000, 2, before)]}
    populate_mock_db(db, remix_entities)
    notifications = get_milestone_notifications(db)
    assert len(notifications) == 0

    # Insert 1st remix after contest start (should trigger 1 milestone)
    remix_entities = {"tracks": [make_remix(1001, 3, now + timedelta(minutes=1))]}
    populate_mock_db(db, remix_entities)
    notifications = get_milestone_notifications(db)
    milestones = {n.data["milestone"] for n in notifications}
    assert milestones == {1}
    assert len(notifications) == 1

    # Insert 9 more remixes (total 10 after contest start)
    remix_entities = {
        "tracks": [
            make_remix(1002 + i, 4 + i, now + timedelta(minutes=2 + i))
            for i in range(9)
        ]
    }
    populate_mock_db(db, remix_entities)
    notifications = get_milestone_notifications(db)
    milestones = {n.data["milestone"] for n in notifications}
    assert milestones == {1, 10}
    assert len([n for n in notifications if n.data["milestone"] == 10]) == 1

    # Insert 40 more remixes (total 50 after contest start)
    remix_entities = {
        "tracks": [
            make_remix(1011 + i, 13 + i, now + timedelta(minutes=11 + i))
            for i in range(40)
        ]
    }
    populate_mock_db(db, remix_entities)
    notifications = get_milestone_notifications(db)
    milestones = {n.data["milestone"] for n in notifications}
    assert milestones == {1, 10, 50}
    assert len([n for n in notifications if n.data["milestone"] == 50]) == 1

    # Final check: only 3 notifications, and all are for the contest creator and correct event/track
    assert len(notifications) == 3
    for n in notifications:
        assert n.user_ids == [TEST_CONTEST_CREATOR_ID]
        assert n.data["event_id"] == TEST_EVENT_ID
        assert n.data["entity_id"] == TEST_PARENT_TRACK_ID
