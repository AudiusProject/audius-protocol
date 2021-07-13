import logging
from src.queries import response_name_constants
from src.models import RepostType, SaveType
from src.queries.query_helpers import populate_playlist_metadata
from src.utils.db_session import get_db
from tests.utils import populate_mock_db

logger = logging.getLogger(__name__)


def test_populate_playlist_metadata(app):
    """Tests that populate_playlist_metadata works after aggregate_user refresh"""
    with app.app_context():
        db = get_db()

    test_entities = {
        "playlists": [
            {"playlist_id": 1, "playlist_owner_id": 1},
            {"playlist_id": 2, "playlist_owner_id": 1},
            {"playlist_id": 3, "playlist_owner_id": 2},
            {"playlist_id": 4, "playlist_owner_id": 3},
        ],
        "users": [
            {"user_id": 1, "handle": "user1"},
            {"user_id": 2, "handle": "user2"},
            {"user_id": 3, "handle": "user3"},
            {"user_id": 4, "handle": "user4"},
        ],
        "reposts": [
            {"repost_item_id": 1, "repost_type": "playlist", "user_id": 2},
            {"repost_item_id": 1, "repost_type": "playlist", "user_id": 3},
            {"repost_item_id": 2, "repost_type": "playlist", "user_id": 1},
        ],
        "saves": [
            {"save_item_id": 1, "save_type": "playlist", "user_id": 2},
            {"save_item_id": 1, "save_type": "playlist", "user_id": 3},
            {"save_item_id": 3, "save_type": "playlist", "user_id": 2},
            {"save_item_id": 3, "save_type": "playlist", "user_id": 1},
        ],
        "follows": [
            {"follower_user_id": 1, "followee_user_id": 2},
            {"follower_user_id": 1, "followee_user_id": 3},
        ],
    }

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        session.execute("REFRESH MATERIALIZED VIEW aggregate_playlist")
        playlist_ids = [1, 2, 3, 4]
        playlists = [
            {"playlist_id": 1, "playlist_contents": {"track_ids": []}},
            {"playlist_id": 2, "playlist_contents": {"track_ids": []}},
            {"playlist_id": 3, "playlist_contents": {"track_ids": []}},
            {"playlist_id": 4, "playlist_contents": {"track_ids": []}},
        ]

        playlists = populate_playlist_metadata(
            session,
            playlist_ids,
            playlists,
            [RepostType.playlist, RepostType.album],
            [SaveType.playlist, SaveType.album],
            None,
        )
        assert len(playlists) == 4
        assert playlists[0]["playlist_id"] == 1
        assert playlists[0][response_name_constants.repost_count] == 2
        assert playlists[0][response_name_constants.save_count] == 2
        assert playlists[0][response_name_constants.total_play_count] == 0

        assert playlists[1]["playlist_id"] == 2
        assert playlists[1][response_name_constants.repost_count] == 1
        assert playlists[1][response_name_constants.save_count] == 0
        assert playlists[1][response_name_constants.total_play_count] == 0

        assert playlists[2]["playlist_id"] == 3
        assert playlists[2][response_name_constants.repost_count] == 0
        assert playlists[2][response_name_constants.save_count] == 2
        assert playlists[2][response_name_constants.total_play_count] == 0

        curr_playlist_ids = [1, 2, 3]
        curr_playlists = [
            {"playlist_id": 1, "playlist_contents": {"track_ids": []}},
            {"playlist_id": 2, "playlist_contents": {"track_ids": []}},
            {"playlist_id": 3, "playlist_contents": {"track_ids": []}},
        ]

        playlists = populate_playlist_metadata(
            session,
            curr_playlist_ids,
            curr_playlists,
            [RepostType.playlist, RepostType.album],
            [SaveType.playlist, SaveType.album],
            1,
        )
        assert len(playlists) == 3

        assert playlists[0]["playlist_id"] == 1
        repost_user_ids = [
            repost["user_id"]
            for repost in playlists[0][response_name_constants.followee_reposts]
        ]
        repost_user_ids.sort()
        assert repost_user_ids == [2, 3]
        save_user_ids = [
            save["user_id"]
            for save in playlists[0][response_name_constants.followee_saves]
        ]
        save_user_ids.sort()
        assert save_user_ids == [2, 3]
        assert playlists[0][response_name_constants.has_current_user_reposted] == False
        assert playlists[0][response_name_constants.has_current_user_saved] == False

        assert playlists[1]["playlist_id"] == 2
        assert playlists[1][response_name_constants.followee_reposts] == []
        assert playlists[1][response_name_constants.followee_saves] == []
        assert playlists[1][response_name_constants.has_current_user_reposted] == True
        assert playlists[1][response_name_constants.has_current_user_saved] == False

        assert playlists[2]["playlist_id"] == 3
        assert playlists[2][response_name_constants.followee_reposts] == []
        save_user_ids = [
            save["user_id"]
            for save in playlists[2][response_name_constants.followee_saves]
        ]
        save_user_ids.sort()
        assert save_user_ids == [2]
        assert playlists[2][response_name_constants.has_current_user_reposted] == False
        assert playlists[2][response_name_constants.has_current_user_saved] == True
