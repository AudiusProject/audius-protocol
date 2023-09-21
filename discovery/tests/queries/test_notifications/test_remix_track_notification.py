import logging
from datetime import datetime, timedelta

from src.models.notifications.notification import Notification
from src.queries.get_notifications import get_notifications
from src.utils.db_session import get_db
from tests.utils import populate_mock_db

t1 = datetime(2020, 10, 10, 10, 35, 0)
t2 = t1 - timedelta(hours=1)
t3 = t1 - timedelta(hours=2)
t4 = t1 - timedelta(hours=3)

logger = logging.getLogger(__name__)


def test_remix_track_notifications(app):
    with app.app_context():
        db_mock = get_db()

        test_entities = {
            "users": [{"user_id": i + 1} for i in range(4)],
            "tracks": [{"track_id": 1, "owner_id": 1}],
        }

        populate_mock_db(db_mock, test_entities)

        remix_entities = {
            "tracks": [
                {
                    "track_id": 2,
                    "owner_id": 2,
                    "created_at": t1,
                    "updated_at": t1,
                    "remix_of": {"tracks": [{"parent_track_id": 1}]},
                }
            ],
        }

        populate_mock_db(db_mock, remix_entities)

        cosign_entities = {
            "reposts": [
                {
                    "user_id": 1,
                    "repost_type": "track",
                    "repost_item_id": 2,
                    "created_at": t1,
                }
            ],
        }

        populate_mock_db(db_mock, cosign_entities)

        with db_mock.scoped_session() as session:
            nts = session.query(Notification).all()
            logger.info(nts)
            args_1 = {"limit": 10, "user_id": 1}
            u1_notifs = get_notifications(session, args_1)
            assert len(u1_notifs) == 1
            assert (
                u1_notifs[0]["group_id"] == "remix:track:2:parent_track:1:blocknumber:4"
            )
            assert u1_notifs[0]["is_seen"] == False
            assert u1_notifs[0]["actions"] == [
                {
                    "specifier": "2",
                    "type": "remix",
                    "timestamp": t1,
                    "group_id": "remix:track:2:parent_track:1:blocknumber:4",
                    "data": {"parent_track_id": 1, "track_id": 2},
                }
            ]

            args_2 = {"limit": 10, "user_id": 2}
            u2_notifs = get_notifications(session, args_2)

            assert len(u2_notifs) == 2
            assert u2_notifs[0]["group_id"] == "repost:2:type:track"

            assert u2_notifs[1]["group_id"] == "cosign:parent_track1:original_track:2"
            assert u2_notifs[1]["actions"] == [
                {
                    "specifier": "1",
                    "type": "cosign",
                    "timestamp": t1,
                    "group_id": "cosign:parent_track1:original_track:2",
                    "data": {"track_id": 2, "track_owner_id": 2, "parent_track_id": 1},
                }
            ]
