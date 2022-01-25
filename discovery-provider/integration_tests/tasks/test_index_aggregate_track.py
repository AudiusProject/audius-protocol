import logging
from copy import deepcopy
from datetime import datetime, timedelta
from pprint import pprint
from typing import List

from integration_tests.utils import populate_mock_db
from src.models import AggregateTrack
from src.tasks.index_aggregate_track import AGGREGATE_TRACK, _update_aggregate_track
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis
from src.utils.update_indexing_checkpoints import get_last_indexed_checkpoint

redis = get_redis()

logger = logging.getLogger(__name__)


basic_entities = {
    "blocks": [
        {"blockhash": "0", "number": 4, "parenthash": -1, "is_current": True},
    ],
    "indexing_checkpoints": [{"tablename": AGGREGATE_TRACK, "last_checkpoint": 2}],
    "tracks": [
        {"track_id": 1, "owner_id": 1, "is_current": True},
        {"track_id": 2, "owner_id": 1, "is_current": True},
        {
            "track_id": 3,
            "owner_id": 1,
            "is_current": True,
            "is_delete": True,
        },
        {"track_id": 4, "owner_id": 2, "is_current": True},
        {
            "track_id": 5,
            "owner_id": 1,
            "is_current": True,
            "is_unlisted": True,
        },
    ],
    "reposts": [
        {"repost_item_id": 1, "repost_type": "track", "user_id": 2},
        {"repost_item_id": 1, "repost_type": "track", "user_id": 3},
        {"repost_item_id": 1, "repost_type": "track", "user_id": 4},
    ],
    "saves": [
        {"save_item_id": 1, "save_type": "track", "user_id": 2},
        {"save_item_id": 3, "save_type": "track", "user_id": 8},
        {"save_item_id": 4, "save_type": "track", "user_id": 2},
        {"save_item_id": 4, "save_type": "track", "user_id": 4},
        {"save_item_id": 4, "save_type": "track", "user_id": 6},
        {"save_item_id": 4, "save_type": "track", "user_id": 8},
    ],
}


def basic_tests(session, last_checkpoint=8, previous_count=0):
    """Helper for testing the basic_entities as is"""

    # read from aggregate_track table
    results: List[AggregateTrack] = (
        session.query(AggregateTrack).order_by(AggregateTrack.track_id).all()
    )

    pprint(results)
    assert len(results) == 4

    assert results[0].track_id == 1
    assert results[0].repost_count == previous_count + 3
    assert results[0].save_count == previous_count + 1

    assert results[1].track_id == 2
    assert results[1].repost_count == previous_count + 0
    assert results[1].save_count == previous_count + 0

    assert results[2].track_id == 4
    assert results[2].repost_count == previous_count + 0
    assert results[2].save_count == previous_count + 4

    assert results[3].track_id == 5
    assert results[3].repost_count == previous_count + 0
    assert results[3].save_count == previous_count + 0

    prev_id_checkpoint = get_last_indexed_checkpoint(session, AGGREGATE_TRACK)
    assert prev_id_checkpoint == last_checkpoint


def created_entity_tests(results, count):
    assert len(results) == count, "Test that the entities were created"

    for i in range(count):
        assert results[i].track_id == i + 1, "Test that the entities were created"
        assert results[i].repost_count == 9, "Test that the entities were created"
        assert results[i].save_count == 9, "Test that the entities were created"


def test_index_aggregate_track_populate(app):
    """Test that we should populate tracks from empty"""

    with app.app_context():
        db = get_db()

    with db.scoped_session() as session:
        results: List[AggregateTrack] = (
            session.query(AggregateTrack).order_by(AggregateTrack.track_id).all()
        )

        assert (
            len(results) == 0
        ), "Test aggregate_track is empty before populate_mock_db()"

    # create db entries based on entities
    populate_mock_db(db, basic_entities, block_offset=3)

    with db.scoped_session() as session:
        # confirm nothing exists before _update_aggregate_track()
        results: List[AggregateTrack] = (
            session.query(AggregateTrack).order_by(AggregateTrack.track_id).all()
        )
        assert (
            len(results) == 0
        ), "Test aggregate_track is empty before _update_aggregate_track()"

        # trigger celery task
        _update_aggregate_track(session)

        # run basic tests against basic_entities
        basic_tests(session)


def test_index_aggregate_track_empty_tracks(app):
    """Test that track metadata without tracks table won't break"""

    with app.app_context():
        db = get_db()

    entities = {
        "users": [],
        "indexing_checkpoints": [{"tablename": AGGREGATE_TRACK, "last_checkpoint": 0}],
        "tracks": [],
        "reposts": [
            {"repost_item_id": 1, "repost_type": "track", "track_id": 1},
            {"repost_item_id": 1, "repost_type": "playlist", "track_id": 1},
        ],
        "saves": [
            {"save_item_id": 1, "save_type": "track", "track_id": 1},
            {"save_item_id": 1, "save_type": "playlist", "track_id": 1},
        ],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        _update_aggregate_track(session)

        results: List[AggregateTrack] = (
            session.query(AggregateTrack).order_by(AggregateTrack.track_id).all()
        )

        assert (
            len(results) == 0
        ), "Test that without Tracks there will be no AggregateTracks"

        prev_id_checkpoint = get_last_indexed_checkpoint(session, AGGREGATE_TRACK)
        assert prev_id_checkpoint == 1


def test_index_aggregate_track_empty_activity(app):
    """Test that a populated tracks table without activity won't break"""

    with app.app_context():
        db = get_db()

    entities = {
        "tracks": [
            {"track_id": 1, "owner_id": 1, "is_current": True},
            {"track_id": 2, "owner_id": 1, "is_current": True},
            {
                "track_id": 3,
                "owner_id": 1,
                "is_current": True,
                "is_delete": True,
            },
            {"track_id": 4, "owner_id": 2, "is_current": True},
            {
                "track_id": 5,
                "owner_id": 1,
                "is_current": True,
                "is_unlisted": True,
            },
        ],
        "indexing_checkpoints": [{"tablename": AGGREGATE_TRACK, "last_checkpoint": 10}],
    }

    populate_mock_db(db, entities, block_offset=6)

    with db.scoped_session() as session:
        _update_aggregate_track(session)

        results: List[AggregateTrack] = (
            session.query(AggregateTrack).order_by(AggregateTrack.track_id).all()
        )
        pprint(results)

        assert (
            len(results) == 0
        ), "Test that tracks updated on blocks previous to '10' will not be targeted"

        prev_id_checkpoint = get_last_indexed_checkpoint(session, AGGREGATE_TRACK)
        assert prev_id_checkpoint == 10

    entities = {
        "indexing_checkpoints": [{"tablename": AGGREGATE_TRACK, "last_checkpoint": 1}],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        _update_aggregate_track(session)

        results: List[AggregateTrack] = (
            session.query(AggregateTrack).order_by(AggregateTrack.track_id).all()
        )

        assert (
            len(results) == 4
        ), "Test that tracks updated on blocks after '1' will be targeted"

        prev_id_checkpoint = get_last_indexed_checkpoint(session, AGGREGATE_TRACK)
        assert prev_id_checkpoint == 10


def test_index_aggregate_track_empty_completely(app):
    """Test a completely empty database won't break"""

    with app.app_context():
        db = get_db()

    entities = {}

    populate_mock_db(db, entities, block_offset=3)

    with db.scoped_session() as session:
        _update_aggregate_track(session)

        results: List[AggregateTrack] = (
            session.query(AggregateTrack).order_by(AggregateTrack.track_id).all()
        )

        assert (
            len(results) == 0
        ), "Test that empty entities won't generate AggregateTracks"

        prev_id_checkpoint = get_last_indexed_checkpoint(session, AGGREGATE_TRACK)
        assert prev_id_checkpoint == 0


def test_index_aggregate_track_update(app):
    """Test that the aggregate_track data is continously added to"""

    with app.app_context():
        db = get_db()

    entities = deepcopy(basic_entities)
    entities.update(
        {
            "aggregate_track": [
                {
                    "track_id": 1,
                    "repost_count": 9,
                    "save_count": 9,
                },
                {
                    "track_id": 2,
                    "repost_count": 9,
                    "save_count": 9,
                },
                {
                    "track_id": 4,
                    "repost_count": 9,
                    "save_count": 9,
                },
                {
                    "track_id": 5,
                    "repost_count": 9,
                    "save_count": 9,
                },
            ],
        }
    )

    populate_mock_db(db, entities, block_offset=3)

    with db.scoped_session() as session:
        results: List[AggregateTrack] = (
            session.query(AggregateTrack).order_by(AggregateTrack.track_id).all()
        )

        assert len(results) == 4, "Test that the entities were created"
        for i, n in enumerate((0, 1, 3, 4)):
            assert results[i].track_id == n + 1, "Test that the entities were created"
            assert results[i].repost_count == 9, "Test that the entities were created"
            assert results[i].save_count == 9, "Test that the entities were created"

        _update_aggregate_track(session)

    with db.scoped_session() as session:
        basic_tests(session)


def test_index_aggregate_track_update_with_extra_user(app):
    """Test that the aggregate_track only modifies non-deleted tracks"""

    with app.app_context():
        db = get_db()

    entities = deepcopy(basic_entities)
    entities.update(
        {
            "indexing_checkpoints": [
                {"tablename": AGGREGATE_TRACK, "last_checkpoint": 0}
            ],
            "aggregate_track": [
                {
                    "track_id": 1,
                    "repost_count": 9,
                    "save_count": 9,
                },
                {
                    "track_id": 2,
                    "repost_count": 9,
                    "save_count": 9,
                },
                {
                    "track_id": 3,
                    "repost_count": 9,
                    "save_count": 9,
                },
                {
                    "track_id": 4,
                    "repost_count": 9,
                    "save_count": 9,
                },
                {
                    "track_id": 5,
                    "repost_count": 9,
                    "save_count": 9,
                },
            ],
        }
    )

    with db.scoped_session() as session:
        results: List[AggregateTrack] = (
            session.query(AggregateTrack).order_by(AggregateTrack.track_id).all()
        )
        assert len(results) == 0, "Test that we start with clean tables"

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        results: List[AggregateTrack] = (
            session.query(AggregateTrack).order_by(AggregateTrack.track_id).all()
        )
        assert len(results) == 5, "Test that aggregate_track entities are populated"
        for result in results:
            assert result.repost_count == 9, "Test entities were populated correctly"
            assert result.save_count == 9, "Test entities were populated correctly"

        _update_aggregate_track(session)

    with db.scoped_session() as session:
        results: List[AggregateTrack] = (
            session.query(AggregateTrack).order_by(AggregateTrack.track_id).all()
        )

        assert len(results) == 5

        assert results[0].track_id == 1
        assert results[0].repost_count == 3
        assert results[0].save_count == 1

        assert results[1].track_id == 2
        assert results[1].repost_count == 0
        assert results[1].save_count == 0

        assert results[2].track_id == 3, "Test that #3 is not overwritten since #3 is marked as deleted"
        assert results[2].repost_count == 9, "Test that #3 is not overwritten since #3 is marked as deleted"
        assert results[2].save_count == 9, "Test that #3 is not overwritten since #3 is marked as deleted"

        assert results[3].track_id == 4
        assert results[3].repost_count == 0
        assert results[3].save_count == 4

        assert results[4].track_id == 5
        assert results[4].repost_count == 0
        assert results[4].save_count == 0

        prev_id_checkpoint = get_last_indexed_checkpoint(session, AGGREGATE_TRACK)
        assert prev_id_checkpoint == 5


def test_index_aggregate_track_entity_model(app):
    """Test that aggregate_track will return information when using seeded entities"""

    with app.app_context():
        db = get_db()

    entities = {
        "aggregate_track": [
            {
                "track_id": 1,
                "repost_count": 9,
                "save_count": 9,
            },
            {
                "track_id": 2,
                "repost_count": 9,
                "save_count": 9,
            },
            {
                "track_id": 3,
                "repost_count": 9,
                "save_count": 9,
            },
            {
                "track_id": 4,
                "repost_count": 9,
                "save_count": 9,
            },
        ],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        results: List[AggregateTrack] = (
            session.query(AggregateTrack).order_by(AggregateTrack.track_id).all()
        )
        created_entity_tests(results, 4)


def test_index_aggregate_track_update_with_only_aggregate_track(app):
    """Test that aggregate_track will be truncated even when no other data"""

    with app.app_context():
        db = get_db()

    entities = {
        "aggregate_track": [
            {
                "track_id": 1,
                "repost_count": 9,
                "save_count": 9,
            },
            {
                "track_id": 2,
                "repost_count": 9,
                "save_count": 9,
            },
            {
                "track_id": 3,
                "repost_count": 9,
                "save_count": 9,
            },
        ],
        "indexing_checkpoints": [{"tablename": AGGREGATE_TRACK, "last_checkpoint": 9}],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        results: List[AggregateTrack] = (
            session.query(AggregateTrack).order_by(AggregateTrack.track_id).all()
        )
        assert len(results) == 3, "Test that entities exist as expected"

        _update_aggregate_track(session)

        results: List[AggregateTrack] = (
            session.query(AggregateTrack).order_by(AggregateTrack.track_id).all()
        )
        assert (
            len(results) == 3
        ), "Test zero-modifications since last_checkpoint is in the future"

        prev_id_checkpoint = get_last_indexed_checkpoint(session, AGGREGATE_TRACK)
        assert prev_id_checkpoint == 9

    # entities = {
    #     "indexing_checkpoints": [{"tablename": AGGREGATE_TRACK, "last_checkpoint": 0}],
    # }
    # populate_mock_db(db, entities)

    # with db.scoped_session() as session:
    #     results: List[AggregateTrack] = (
    #         session.query(AggregateTrack).order_by(AggregateTrack.track_id).all()
    #     )
    #     assert (
    #         len(results) == 3
    #     ), "Test that entities exist as expected, even though checkpoint has been reset"

    #     _update_aggregate_track(session)

    #     results: List[AggregateTrack] = (
    #         session.query(AggregateTrack).order_by(AggregateTrack.track_id).all()
    #     )
    #     assert (
    #         len(results) == 0
    #     ), "Test that aggregate_track has been truncated due to reset checkpoint"

    #     prev_id_checkpoint = get_last_indexed_checkpoint(session, AGGREGATE_TRACK)
    #     assert prev_id_checkpoint == 0


def test_index_aggregate_track_same_checkpoint(app):
    """Test that we should not update when last index is the same"""

    with app.app_context():
        db = get_db()

    entities = deepcopy(basic_entities)
    current_blocknumber = basic_entities["blocks"][0]["number"] = 5
    entities.update(
        {
            "indexing_checkpoints": [
                {"tablename": AGGREGATE_TRACK, "last_checkpoint": current_blocknumber}
            ],
        }
    )

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        results: List[AggregateTrack] = (
            session.query(AggregateTrack).order_by(AggregateTrack.track_id).all()
        )
        assert len(results) == 0

        _update_aggregate_track(session)

        results: List[AggregateTrack] = (
            session.query(AggregateTrack).order_by(AggregateTrack.track_id).all()
        )
        assert len(results) == 0

        prev_id_checkpoint = get_last_indexed_checkpoint(session, AGGREGATE_TRACK)
        assert prev_id_checkpoint == 5
