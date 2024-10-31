import logging

from integration_tests.utils import populate_mock_db
from src.api.v1.utils.extend_notification import extend_notification
from src.models.users.usdc_purchase import PurchaseType
from src.queries.get_notifications import NotificationType, get_notifications
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


def test_get_track_added_to_purchased_album_notifications(app):
    with app.app_context():
        db_mock = get_db()

        test_entities = {
            "users": [{"user_id": i + 1} for i in range(2)],
            "tracks": [{"track_id": 6, "owner_id": 1}],
            "playlists": [
                {
                    "playlist_id": 5,
                    "playlist_owner_id": 1,
                    "playlist_name": "name",
                    "description": "description",
                    "is_album": True,
                    "is_stream_gated": True,
                    "stream_conditions": {
                        "usdc_purchase": {
                            "price": 100,
                            "splits": {
                                "7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy": 1000000
                            },
                        }
                    },
                    "playlist_contents": {
                        "track_ids": [
                            {"track": 6, "time": 1},
                        ]
                    },
                }
            ],
            "usdc_purchases": [
                {
                    "slot": 4,
                    "buyer_user_id": 2,
                    "seller_user_id": 1,
                    "amount": 1000000,
                    "content_type": PurchaseType.album,
                    "content_id": 5,
                }
            ],
        }
        populate_mock_db(db_mock, test_entities)

        test_actions = {
            "playlist_tracks": [
                {"playlist_id": 5, "track_id": 6},
            ],
        }
        populate_mock_db(db_mock, test_actions)

        with db_mock.scoped_session() as session:
            args = {
                "limit": 10,
                "user_id": 2,
                "valid_types": [NotificationType.TRACK_ADDED_TO_PURCHASED_ALBUM],
            }
            u2_notifications = get_notifications(session, args)
            assert len(u2_notifications) == 1
            assert (
                u2_notifications[0]["group_id"]
                == "track_added_to_purchased_album:playlist_id:5:track_id:6"
            )
            assert u2_notifications[0]["is_seen"] == False
            assert len(u2_notifications[0]["actions"]) == 1
            assert u2_notifications[0]["actions"][0]["data"] == {
                "track_id": 6,
                "playlist_id": 5,
                "playlist_owner_id": 1,
            }


def test_extended_track_added_to_purchased_album_notification(app):
    with app.app_context():
        db_mock = get_db()

        test_entities = {
            "users": [{"user_id": i + 1} for i in range(2)],
            "tracks": [{"track_id": 6, "owner_id": 1}],
            "playlists": [
                {
                    "playlist_id": 5,
                    "playlist_owner_id": 1,
                    "playlist_name": "name",
                    "description": "description",
                    "is_album": True,
                    "is_stream_gated": True,
                    "stream_conditions": {
                        "usdc_purchase": {
                            "price": 100,
                            "splits": {
                                "7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy": 1000000
                            },
                        }
                    },
                    "playlist_contents": {
                        "track_ids": [
                            {"track": 6, "time": 1},
                        ]
                    },
                }
            ],
            "usdc_purchases": [
                {
                    "slot": 4,
                    "buyer_user_id": 2,
                    "seller_user_id": 1,
                    "amount": 1000000,
                    "content_type": PurchaseType.album,
                    "content_id": 5,
                }
            ],
        }
        populate_mock_db(db_mock, test_entities)

        test_actions = {
            "playlist_tracks": [
                {"playlist_id": 5, "track_id": 6},
            ],
        }
        populate_mock_db(db_mock, test_actions)

        with db_mock.scoped_session() as session:
            args = {
                "limit": 10,
                "user_id": 2,
                "valid_types": [NotificationType.TRACK_ADDED_TO_PURCHASED_ALBUM],
            }
            u2_notifications = get_notifications(session, args)
            extended_notification = extend_notification(u2_notifications[0])
            assert extended_notification["type"] == "track_added_to_purchased_album"
            assert (
                extended_notification["group_id"]
                == "track_added_to_purchased_album:playlist_id:5:track_id:6"
            )
            assert extended_notification["actions"][0]["specifier"] == "ML51L"
            assert (
                extended_notification["actions"][0]["type"]
                == "track_added_to_purchased_album"
            )
            assert extended_notification["actions"][0]["data"] == {
                "track_id": "AnlGe",
                "playlist_id": "pnagD",
                "playlist_owner_id": "7eP5n",
            }
