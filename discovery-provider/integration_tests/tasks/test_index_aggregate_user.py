import logging
from copy import deepcopy
from datetime import datetime, timedelta
from typing import List

from integration_tests.utils import populate_mock_db
from sqlalchemy.sql.expression import true
from src.models import AggregateUser
from src.tasks.index_aggregate_user import AGGREGATE_USER, update_aggregate_table
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis

redis = get_redis()

logger = logging.getLogger(__name__)


# run
basic_entities = {
    "blocks": [
        {"blockhash": "0", "number": 0, "parenthash": -1, "is_current": true},
    ],
    "indexing_checkpoints": [{"tablename": AGGREGATE_USER, "last_checkpoint": 9}],
    "tracks": [
        {"track_id": 1, "owner_id": 1},
        {"track_id": 2, "owner_id": 1},
        {"track_id": 3, "is_unlisted": True, "owner_id": 1},
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
            "playlist_id": 2,
            "is_album": True,
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
    ],
    "users": [
        {"user_id": 1, "handle": "user1"},
        {"user_id": 2, "handle": "user2"},
    ],
    "follows": [
        {
            "follower_user_id": 1,
            "followee_user_id": 2,
            "created_at": datetime.now() - timedelta(days=8),
        },
        {
            "follower_user_id": 2,
            "followee_user_id": 1,
            "created_at": datetime.now() - timedelta(days=8),
        },
    ],
    "reposts": [
        {"repost_item_id": 1, "repost_type": "track", "user_id": 2},
        {"repost_item_id": 1, "repost_type": "playlist", "user_id": 2},
    ],
    "saves": [
        {"save_item_id": 1, "save_type": "track", "user_id": 2},
        {"save_item_id": 1, "save_type": "playlist", "user_id": 2},
    ],
}


def basic_tests(results):
    """Helper for testing the basic_entities as is"""
    assert len(results) == 2

    assert results[0].user_id == 1
    assert results[0].track_count == 2
    assert results[0].playlist_count == 1
    assert results[0].album_count == 1
    assert results[0].follower_count == 1
    assert results[0].following_count == 1
    assert results[0].repost_count == 0
    assert results[0].track_save_count == 0

    assert results[1].user_id == 2
    assert results[1].track_count == 0
    assert results[1].playlist_count == 0
    assert results[1].album_count == 0
    assert results[1].follower_count == 1
    assert results[1].following_count == 1
    assert results[1].repost_count == 2
    assert results[1].track_save_count == 1


# Tests
def test_index_aggregate_user_populate(app):
    """Test that we should populate plays from empty"""

    # date = datetime.now()
    # setup
    with app.app_context():
        db = get_db()

    populate_mock_db(db, basic_entities)

    with db.scoped_session() as session:
        update_aggregate_table(db, redis)

        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )

        basic_tests(results)


def test_index_aggregate_user_empty_users(app):
    """Test that user metadata without users table won't break"""

    # date = datetime.now()
    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = {
        "tracks": [
            {"track_id": 1, "owner_id": 1},
            {"track_id": 2, "owner_id": 1},
            {"track_id": 3, "is_unlisted": True, "owner_id": 1},
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
                "playlist_id": 2,
                "is_album": True,
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
        ],
        "users": [],
        "follows": [
            {
                "follower_user_id": 1,
                "followee_user_id": 2,
                "created_at": datetime.now() - timedelta(days=8),
            },
            {
                "follower_user_id": 2,
                "followee_user_id": 1,
                "created_at": datetime.now() - timedelta(days=8),
            },
        ],
        "reposts": [
            {"repost_item_id": 1, "repost_type": "track", "user_id": 1},
            {"repost_item_id": 1, "repost_type": "playlist", "user_id": 1},
        ],
        "saves": [
            {"save_item_id": 1, "save_type": "track", "user_id": 1},
            {"save_item_id": 1, "save_type": "playlist", "user_id": 1},
        ],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        update_aggregate_table(db, redis)

        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )

        assert len(results) == 0


def test_index_aggregate_user_empty_activity(app):
    """Test that a populated users table without activity won't break"""

    # date = datetime.now()
    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = {
        "users": [
            {"user_id": 1, "handle": "user1"},
            {"user_id": 2, "handle": "user2"},
        ],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        update_aggregate_table(db, redis)

        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )

        assert len(results) == 1

        assert results[0].user_id == 2
        assert results[0].track_count == 0
        assert results[0].playlist_count == 0
        assert results[0].album_count == 0
        assert results[0].follower_count == 0
        assert results[0].following_count == 0
        assert results[0].repost_count == 0
        assert results[0].track_save_count == 0


def test_index_aggregate_user_empty_completely(app):
    """Test a completely empty set of tables won't break"""

    # date = datetime.now()
    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = {}

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        update_aggregate_table(db, redis)

        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )

        assert len(results) == 0


def test_index_aggregate_user_update(app):
    """Test that the aggregate_users data is overwritten"""
    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = deepcopy(basic_entities)
    entities.update(
        {
            "aggregate_user": [
                {
                    "user_id": 1,
                    "track_count": 9,
                    "playlist_count": 9,
                    "album_count": 9,
                    "follower_count": 9,
                    "following_count": 9,
                    "repost_count": 9,
                    "track_save_count": 9,
                },
                {
                    "user_id": 2,
                    "track_count": 9,
                    "playlist_count": 9,
                    "album_count": 9,
                    "follower_count": 9,
                    "following_count": 9,
                    "repost_count": 9,
                    "track_save_count": 9,
                },
            ],
            "indexing_checkpoints": [
                {"tablename": AGGREGATE_USER, "last_checkpoint": 9}
            ],
        }
    )

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )

        assert len(results) == 2

        # update_aggregate_table(db, redis)

        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )

        basic_tests(results)


def test_index_aggregate_user_update_with_extra_user(app):
    """Test that the entire aggregate_user table is truncated"""
    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = deepcopy(basic_entities)
    entities.update(
        {
            "aggregate_user": [
                {
                    "user_id": 1,
                    "track_count": 9,
                    "playlist_count": 9,
                    "album_count": 9,
                    "follower_count": 9,
                    "following_count": 9,
                    "repost_count": 9,
                    "track_save_count": 9,
                },
                {
                    "user_id": 2,
                    "track_count": 9,
                    "playlist_count": 9,
                    "album_count": 9,
                    "follower_count": 9,
                    "following_count": 9,
                    "repost_count": 9,
                    "track_save_count": 9,
                },
                {
                    "user_id": 3,
                    "track_count": 9,
                    "playlist_count": 9,
                    "album_count": 9,
                    "follower_count": 9,
                    "following_count": 9,
                    "repost_count": 9,
                    "track_save_count": 9,
                },
            ],
            "indexing_checkpoints": [
                {"tablename": AGGREGATE_USER, "last_checkpoint": 9}
            ],
        }
    )

    with db.scoped_session() as session:
        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )
        assert len(results) == 0

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )
        # assert len(results) == 3

        # update_aggregate_table(db, redis)

        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )

        basic_tests(results)


def test_index_aggregate_user_update_with_only_aggregate_users(app):
    """Test that aggregate_user will be truncated even when no other data"""
    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = {
        "aggregate_user": [
            {
                "user_id": 1,
                "track_count": 9,
                "playlist_count": 9,
                "album_count": 9,
                "follower_count": 9,
                "following_count": 9,
                "repost_count": 9,
                "track_save_count": 9,
            },
            {
                "user_id": 2,
                "track_count": 9,
                "playlist_count": 9,
                "album_count": 9,
                "follower_count": 9,
                "following_count": 9,
                "repost_count": 9,
                "track_save_count": 9,
            },
            {
                "user_id": 3,
                "track_count": 9,
                "playlist_count": 9,
                "album_count": 9,
                "follower_count": 9,
                "following_count": 9,
                "repost_count": 9,
                "track_save_count": 9,
            },
        ],
        "indexing_checkpoints": [{"tablename": AGGREGATE_USER, "last_checkpoint": 9}],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )

        assert len(results) == 0

        # update_aggregate_table(db, redis)

        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )

        assert len(results) == 0


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
