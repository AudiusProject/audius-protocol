import logging
from datetime import datetime, timedelta
from typing import List

from integration_tests.utils import populate_mock_db
from src.models import AggregateUser
from src.tasks.index_aggregate_user import update_aggregate_table
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis

redis = get_redis()

logger = logging.getLogger(__name__)


# Tests
def test_index_aggregate_user_populate(app):
    """Test that we should populate plays from empty"""

    # date = datetime.now()
    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = {
        "tracks": [
            {"track_id": 1, "owner_id": 1},
            {"track_id": 2, "owner_id": 2},
            {"track_id": 3, "owner_id": 3},
            {"track_id": 4, "is_unlisted": True, "owner_id": 3},
        ],
        "playlists": [
            {
                "playlist_id": 1,
                "playlist_owner_id": 1,
                "playlist_name": "name",
                "description": "description",
                "playlist_contents": {
                    "track_ids": [
                        {"track": 1, "time": 1},
                        {"track": 2, "time": 2},
                        {"track": 3, "time": 3},
                    ]
                },
            },
            {
                "playlist_id": 3,
                "is_album": True,
                "playlist_owner_id": 3,
                "playlist_name": "name",
                "description": "description",
                "playlist_contents": {
                    "track_ids": [
                        {"track": 1, "time": 1},
                        {"track": 2, "time": 2},
                        {"track": 3, "time": 3},
                    ]
                },
            },
        ],
        "users": [
            {"user_id": 1, "handle": "user1"},
            {"user_id": 2, "handle": "user2"},
            {"user_id": 3, "handle": "user3"},
            {"user_id": 4, "handle": "user4"},
            {"user_id": 5, "handle": "user5"},
        ],
        "follows": [
            {
                "follower_user_id": 1,
                "followee_user_id": 2,
                "created_at": datetime.now() - timedelta(days=8),
            },
            {
                "follower_user_id": 1,
                "followee_user_id": 3,
                "created_at": datetime.now() - timedelta(days=8),
            },
            {
                "follower_user_id": 2,
                "followee_user_id": 3,
                "created_at": datetime.now() - timedelta(days=8),
            },
        ],
        "reposts": [
            {"repost_item_id": 1, "repost_type": "track", "user_id": 2},
            {"repost_item_id": 1, "repost_type": "playlist", "user_id": 2},
        ],
        "saves": [
            {"save_item_id": 1, "save_type": "track", "user_id": 2},
            {"save_item_id": 1, "save_type": "playlist", "user_id": 4},
        ],
        "plays": [{"item_id": 1} for _ in range(55)]
        + [{"item_id": 2} for _ in range(60)],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        update_aggregate_table(db, redis)

        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )

        assert len(results) == 5

        assert results[0].user_id == 1
        assert results[0].track_count == 1
        assert results[0].playlist_count == 1
        assert results[0].playlist_count == 1
        assert results[0].album_count == 0
        assert results[0].follower_count == 0
        assert results[0].following_count == 2
        assert results[0].repost_count == 0
        assert results[0].track_save_count == 0



# def test_index_aggregate_use`r_update(app):
#     """Test that we should insert new play counts and update existing"""
#     # setup
#     with app.app_context():
#         db = get_db()

#     # run
#     entities = {
#         "tracks": [
#             {"track_id": 1, "title": "track 1"},
#             {"track_id": 2, "title": "track 2"},
#             {"track_id": 3, "title": "track 3"},
#             {"track_id": 4, "title": "track 4"},
#         ],
#         "aggregate_user": [
#             # Current Plays
#             {"play_item_id": 1, "count": 3},
#             {"play_item_id": 2, "count": 3},
#             {"play_item_id": 3, "count": 3},
#         ],
#         "indexing_checkpoints": [
#             {"tablename": "aggregate_user", "last_checkpoint": 9}
#         ],
#         "plays": [
#             # Current Plays
#             {"item_id": 1},
#             {"item_id": 1},
#             {"item_id": 1},
#             {"item_id": 2},
#             {"item_id": 2},
#             {"item_id": 2},
#             {"item_id": 3},
#             {"item_id": 3},
#             {"item_id": 3},
#             # New plays
#             {"item_id": 1},
#             {"item_id": 1},
#             {"item_id": 2},
#             {"item_id": 4},
#             {"item_id": 4},
#         ],
#     }

#     populate_mock_db(db, entities)

#     with db.scoped_session() as session:
#         update_aggregate_table(db, redis)

#         results: List[AggregatePlays] = (
#             session.query(AggregatePlays).order_by(AggregatePlays.play_item_id).all()
#         )

#         assert len(results) == 4
#         assert results[0].play_item_id == 1
#         assert results[0].count == 5
#         assert results[1].play_item_id == 2
#         assert results[1].count == 4
#         assert results[2].play_item_id == 3
#         assert results[2].count == 3
#         assert results[3].play_item_id == 4
#         assert results[3].count == 2


# def test_index_aggregate_user_same_checkpoint(app):
#     """Test that we should not update when last index is the same"""
#     # setup
#     with app.app_context():
#         db = get_db()

#     # run
#     entities = {
#         "tracks": [
#             {"track_id": 1, "title": "track 1"},
#             {"track_id": 2, "title": "track 2"},
#             {"track_id": 3, "title": "track 3"},
#             {"track_id": 4, "title": "track 4"},
#         ],
#         "aggregate_user": [
#             # Current Plays
#             {"play_item_id": 1, "count": 3},
#             {"play_item_id": 2, "count": 3},
#             {"play_item_id": 3, "count": 3},
#         ],
#         "indexing_checkpoints": [
#             {"tablename": "aggregate_user", "last_checkpoint": 9}
#         ],
#         "plays": [
#             # Current Plays
#             {"item_id": 1},
#             {"item_id": 1},
#             {"item_id": 1},
#             {"item_id": 2},
#             {"item_id": 2},
#             {"item_id": 2},
#             {"item_id": 3},
#             {"item_id": 3},
#             {"item_id": 3},
#         ],
#     }

#     populate_mock_db(db, entities)

#     with db.scoped_session() as session:
#         update_aggregate_table(db, redis)

#         results: List[AggregatePlays] = (
#             session.query(AggregatePlays).order_by(AggregatePlays.play_item_id).all()
#         )

#         assert len(results) == 3


# def test_index_aggregate_user_no_plays(app):
#     """Raise exception when there are no plays"""
#     # setup
#     with app.app_context():
#         db = get_db()

#     # run
#     entities = {"plays": []}

#     populate_mock_db(db, entities)

#     with db.scoped_session() as session:
#         try:
#             update_aggregate_table(session)
#             assert (
#                 False
#             ), "test_index_aggregate_user [test_index_aggregate_user_no_plays] failed"
#         except Exception:
#             assert True
