import logging

from integration_tests.utils import populate_mock_db
from src.queries import response_name_constants
from src.queries.query_helpers import populate_track_metadata
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


def test_populate_track_metadata(app):
    """Tests that populate_track_metadata works after aggregate_user update"""
    with app.app_context():
        db = get_db()

    test_entities = {
        "tracks": [
            {"track_id": 1, "owner_id": 1},
            {"track_id": 2, "owner_id": 1},
            {"track_id": 3, "owner_id": 2},
            {"track_id": 4, "owner_id": 2},
            {"track_id": 5, "owner_id": 2},
            {"track_id": 6, "owner_id": 2},
            {"track_id": 7, "owner_id": 3},
            {"track_id": 8, "owner_id": 3},
            {"track_id": 9, "owner_id": 3},
            {"track_id": 10, "is_unlisted": True, "owner_id": 3},
        ],
        "users": [
            {"user_id": 1, "handle": "user1"},
            {"user_id": 2, "handle": "user2"},
            {"user_id": 3, "handle": "user3"},
            {"user_id": 4, "handle": "user4"},
        ],
        "reposts": [
            {"repost_item_id": 1, "repost_type": "track", "user_id": 2},
            {"repost_item_id": 1, "repost_type": "track", "user_id": 3},
            {"repost_item_id": 2, "repost_type": "track", "user_id": 1},
        ],
        "saves": [
            {"save_item_id": 1, "save_type": "track", "user_id": 2},
            {"save_item_id": 1, "save_type": "track", "user_id": 3},
            {"save_item_id": 3, "save_type": "track", "user_id": 2},
            {"save_item_id": 3, "save_type": "track", "user_id": 1},
        ],
        "follows": [
            {"follower_user_id": 1, "followee_user_id": 2},
            {"follower_user_id": 1, "followee_user_id": 3},
        ],
    }

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        track_ids = [1, 2, 3]
        tracks = [
            {"track_id": 1, "track_cid": "baeaaaiqsecyxqc76k2fy5px6vtyp3utdw7kujpvkvdyxscfvvixkeqfsnhviy", "is_stream_gated": False, "is_download_gated": False},
            {"track_id": 2, "track_cid": "QmajYZEhhd5S5aFcTDF2682Liz22Qr4uruDNtPREqxCoRR", "is_stream_gated": False, "is_download_gated": False},
            {"track_id": 3, "track_cid": "QmV7iiDU935ApQio9Exkfw2dcxGDfEMuYmort88s9r9T8m", "is_stream_gated": False, "is_download_gated": False},
        ]

        tracks = populate_track_metadata(session, track_ids, tracks, None)
        assert len(tracks) == 3

        assert tracks[0]["track_id"] == 1
        assert tracks[0][response_name_constants.repost_count] == 2
        assert tracks[0][response_name_constants.save_count] == 2
        assert tracks[0][response_name_constants.play_count] == 0

        assert tracks[1]["track_id"] == 2
        assert tracks[1][response_name_constants.repost_count] == 1
        assert tracks[1][response_name_constants.save_count] == 0
        assert tracks[1][response_name_constants.play_count] == 0

        assert tracks[2]["track_id"] == 3
        assert tracks[2][response_name_constants.repost_count] == 0
        assert tracks[2][response_name_constants.save_count] == 2
        assert tracks[2][response_name_constants.play_count] == 0

        curr_track_ids = [1, 2, 3]
        curr_tracks = [
            {"track_id": 1, "track_cid": "baeaaaiqsecyxqc76k2fy5px6vtyp3utdw7kujpvkvdyxscfvvixkeqfsnhviy", "is_stream_gated": False, "is_download_gated": False},
            {"track_id": 2, "track_cid": "QmajYZEhhd5S5aFcTDF2682Liz22Qr4uruDNtPREqxCoRR", "is_stream_gated": False, "is_download_gated": False},
            {"track_id": 3, "track_cid": "QmV7iiDU935ApQio9Exkfw2dcxGDfEMuYmort88s9r9T8m", "is_stream_gated": False, "is_download_gated": False},
        ]

        tracks = populate_track_metadata(session, curr_track_ids, curr_tracks, 1)
        assert len(tracks) == 3

        assert tracks[0]["track_id"] == 1
        repost_user_ids = [
            repost["user_id"]
            for repost in tracks[0][response_name_constants.followee_reposts]
        ]
        repost_user_ids.sort()
        assert repost_user_ids == [2, 3]
        save_user_ids = [
            save["user_id"]
            for save in tracks[0][response_name_constants.followee_saves]
        ]
        save_user_ids.sort()
        assert save_user_ids == [2, 3]
        assert tracks[0][response_name_constants.has_current_user_reposted] == False
        assert tracks[0][response_name_constants.has_current_user_saved] == False

        assert tracks[1]["track_id"] == 2
        assert tracks[1][response_name_constants.followee_reposts] == []
        assert tracks[1][response_name_constants.followee_saves] == []
        assert tracks[1][response_name_constants.has_current_user_reposted] == True
        assert tracks[1][response_name_constants.has_current_user_saved] == False

        assert tracks[2]["track_id"] == 3
        assert tracks[2][response_name_constants.followee_reposts] == []
        save_user_ids = [
            save["user_id"]
            for save in tracks[2][response_name_constants.followee_saves]
        ]
        save_user_ids.sort()
        assert save_user_ids == [2]
        assert tracks[2][response_name_constants.has_current_user_reposted] == False
        assert tracks[2][response_name_constants.has_current_user_saved] == True
