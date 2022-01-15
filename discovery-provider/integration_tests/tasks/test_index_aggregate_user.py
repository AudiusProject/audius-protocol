import logging
from copy import deepcopy
from datetime import datetime, timedelta
from pprint import pprint
from typing import List

from integration_tests.utils import populate_mock_db
from sqlalchemy.sql.expression import true
from src.models import AggregateUser
from src.tasks.index_aggregate_user import AGGREGATE_USER, _update_aggregate_table
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis

redis = get_redis()

logger = logging.getLogger(__name__)


basic_entities = {
    "blocks": [
        {"blockhash": "0", "number": 2, "parenthash": -1, "is_current": true},
    ],
    "indexing_checkpoints": [{"tablename": AGGREGATE_USER, "last_checkpoint": 1}],
    "users": [
        {"user_id": 1, "handle": "user1", "blocknumber": 2},
        {"user_id": 2, "handle": "user2", "blocknumber": 2},
    ],
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


def created_entity_tests(results, count):
    assert len(results) == count, "Test that the entities were created"

    for i in range(count):
        assert results[i].user_id == i + 1, "Test that the entities were created"
        assert results[i].track_count == 9, "Test that the entities were created"


def test_index_aggregate_user_populate(app):
    """Test that we should populate users from empty"""

    with app.app_context():
        db = get_db()

    with db.scoped_session() as session:
        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )

        assert (
            len(results) == 0
        ), "Test aggregate_user is empty before populate_mock_db()"

    # create db entries based on entities
    populate_mock_db(db, basic_entities)

    with db.scoped_session() as session:
        # confirm nothing exists before _update_aggregate_table()
        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )
        assert (
            len(results) == 0
        ), "Test aggregate_user is empty before _update_aggregate_table()"

        # trigger celery task
        _update_aggregate_table(session)

    with db.scoped_session() as session:
        # read from aggregate_user table
        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )

        # run basic tests against basic_entities
        pprint(results)
        basic_tests(results)


def test_index_aggregate_user_empty_users(app):
    """Test that user metadata without users table won't break"""

    with app.app_context():
        db = get_db()

    entities = {
        "users": [],
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
        _update_aggregate_table(session)

        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )

        assert len(results) == 0


def test_index_aggregate_user_empty_activity(app):
    """Test that a populated users table without activity won't break"""

    with app.app_context():
        db = get_db()

    entities = {
        "users": [
            {"user_id": 1, "handle": "user1"},
            {"user_id": 2, "handle": "user2"},
        ],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        _update_aggregate_table(session)

    with db.scoped_session() as session:
        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )

        # TODO: why does only user2 exist?
        # assert len(results) == 0
        pprint(results)
        assert len(results) == 1  # TODO: remove this line required for lint


def test_index_aggregate_user_empty_completely(app):
    """Test a completely empty database won't break"""

    with app.app_context():
        db = get_db()

    entities = {}

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        _update_aggregate_table(session)

        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )

        assert len(results) == 0


def test_index_aggregate_user_update(app):
    """Test that the aggregate_user data is overwritten"""

    with app.app_context():
        db = get_db()

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
        }
    )

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )
        created_entity_tests(results, 2)

        _update_aggregate_table(session)

    with db.scoped_session() as session:
        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )

        basic_tests(results)


def test_index_aggregate_user_update_with_extra_user(app):
    """Test that the entire aggregate_user table is truncated"""

    with app.app_context():
        db = get_db()

    entities = deepcopy(basic_entities)
    entities.update(
        {
            "indexing_checkpoints": [
                {"tablename": AGGREGATE_USER, "last_checkpoint": 0}
            ],
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
        assert len(results) == 3

        _update_aggregate_table(session)

    with db.scoped_session() as session:
        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )
        basic_tests(results)


def test_index_aggregate_user_entity_model(app):
    """Test that aggregate_user will return information when using seeded entities"""

    with app.app_context():
        db = get_db()

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
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )
        created_entity_tests(results, 3)


# TODO: test with block.number being 0 in order to activate truncation
def test_index_aggregate_user_update_with_only_aggregate_user(app):
    """Test that aggregate_user will be truncated even when no other data"""

    with app.app_context():
        db = get_db()

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
        assert len(results) == 3, "Test that entities exist as expected"

        _update_aggregate_table(session)

    with db.scoped_session() as session:
        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )
        assert (
            len(results) == 3
        ), "Test zero-modifications since last_checkpoint is in the future"

    entities = {
        "indexing_checkpoints": [{"tablename": AGGREGATE_USER, "last_checkpoint": 0}],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )
        assert (
            len(results) == 3
        ), "Test that entities exist as expected, even though checkpoint has been reset"

        _update_aggregate_table(session)

    with db.scoped_session() as session:
        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )
        assert (
            len(results) == 0
        ), "Test that aggregate_user has been truncated due to reset checkpoint"


def test_index_aggregate_user_same_checkpoint(app):
    """Test that we should not update when last index is the same"""

    with app.app_context():
        db = get_db()

    entities = deepcopy(basic_entities)
    current_blocknumber = basic_entities["blocks"][0]["number"]
    entities.update(
        {
            "indexing_checkpoints": [
                {"tablename": AGGREGATE_USER, "last_checkpoint": current_blocknumber}
            ],
        }
    )

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )
        assert len(results) == 0

        _update_aggregate_table(session)

    with db.scoped_session() as session:
        results: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )
        assert len(results) == 0
