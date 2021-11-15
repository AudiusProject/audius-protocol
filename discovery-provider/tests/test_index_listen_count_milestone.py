from datetime import datetime
import redis
from src.tasks.index_listen_count_milestones import (
    CURRENT_PLAY_INDEXING,
    TRACK_LISTEN_IDS,
    index_listen_count_milestones,
    get_next_track_milestone
)
from src.utils.db_session import get_db
from src.models import (
    Milestone,
)
from src.utils.config import shared_config
from src.utils.redis_cache import set_json_cached_key

from tests.utils import populate_mock_db

REDIS_URL = shared_config["redis"]["url"]
DEFAULT_EVENT = ""

def test_get_next_track_milestone():
    next_milestone = get_next_track_milestone(8)
    assert next_milestone == None

    next_milestone = get_next_track_milestone(10)
    assert next_milestone == 10

    next_milestone = get_next_track_milestone(520)
    assert next_milestone == 500

    # Test get next milestone with prev milestone defined
    next_milestone = get_next_track_milestone(12, 10)
    assert next_milestone == None

    next_milestone = get_next_track_milestone(28, 10)
    assert next_milestone == 25

    next_milestone = get_next_track_milestone(50, 10)
    assert next_milestone == 50

    next_milestone = get_next_track_milestone(520, 10)
    assert next_milestone == 500

    next_milestone = get_next_track_milestone(1000100, 100000)
    assert next_milestone == 1000000

    next_milestone = get_next_track_milestone(1000100, 1000000)
    assert next_milestone == None


track_ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

def test_listen_count_milestone_processing(app):
    redis_conn = redis.Redis.from_url(url=REDIS_URL)
    set_json_cached_key(redis_conn, CURRENT_PLAY_INDEXING, { 'slot': 12, 'timestamp': 1634836054 })
    with app.app_context():
        db = get_db()

        test_entities = {
            "plays": [{"item_id": 1} for _ in range(8)]
            + [{"item_id": 2} for _ in range(10)] # milestone 10
            + [{"item_id": 3} for _ in range(11)] # milestone 10
            + [{"item_id": 4} for _ in range(12)] # milestone 10
            + [{"item_id": 5} for _ in range(25)] # milestone 25
            + [{"item_id": 6} for _ in range(27)] # milestone 25
            + [{"item_id": 7} for _ in range(40)] # milestone 25
            + [{"item_id": 8} for _ in range(80)] # milestone 50
            + [{"item_id": 9} for _ in range(111)] # milestone 100
            + [{"item_id": 10} for _ in range(25)] # milestone 25
        }
        populate_mock_db(db, test_entities)

        with db.scoped_session() as session:
            session.execute("REFRESH MATERIALIZED VIEW aggregate_plays")

        redis_conn.sadd(TRACK_LISTEN_IDS, *track_ids)

        index_listen_count_milestones(db, redis_conn)
        with db.scoped_session() as session:
            milestones = session.query(Milestone).all()
            assert len(milestones) == 9
            sorted_milestones = sorted(milestones, key=lambda m: m.id)
            sorted_milestones = [(
                milestone.id,
                milestone.threshold,
                milestone.slot,
                milestone.timestamp
            ) for milestone in sorted_milestones]

            assert sorted_milestones == [
                (2, 10, 12, datetime.fromtimestamp(1634836054)),
                (3, 10, 12, datetime.fromtimestamp(1634836054)),
                (4, 10, 12, datetime.fromtimestamp(1634836054)),
                (5, 25, 12, datetime.fromtimestamp(1634836054)),
                (6, 25, 12, datetime.fromtimestamp(1634836054)),
                (7, 25, 12, datetime.fromtimestamp(1634836054)),
                (8, 50, 12, datetime.fromtimestamp(1634836054)),
                (9, 100, 12, datetime.fromtimestamp(1634836054)),
                (10, 25, 12, datetime.fromtimestamp(1634836054)),
            ]

        # Add the same track and process to check that no new milesetones are created
        redis_conn.sadd(TRACK_LISTEN_IDS, *track_ids)
        index_listen_count_milestones(db, redis_conn)
        with db.scoped_session() as session:
            milestones = session.query(Milestone).all()
            assert len(milestones) == 9

        test_entities = {
            "plays": [{"item_id": 1, "id": 1000+i} for i in range(3)] # 3 + 8 = 11 new
            + [{"item_id": 2, "id": 1200+i} for i in range(100)] # 10 + 100 = 110 new
            + [{"item_id": 3, "id": 1400+i} for i in range(10)] # 10 + 11 = 21 not new
            + [{"item_id": 4, "id": 1600+i} for i in range(1000)] # 1000 + 12 = 1012 new
            + [{"item_id": 8, "id": 3000+i} for i in range(19)] # 19 + 80 = 99 not new
            + [{"item_id": 9, "id": 9000+i} for i in range(5000)] # 5000 + 111 = 5111 new
        }
        populate_mock_db(db, test_entities)
        with db.scoped_session() as session:
            session.execute("REFRESH MATERIALIZED VIEW aggregate_plays")

        # Add the same track and process to check that no new milesetones are created
        redis_conn.sadd(TRACK_LISTEN_IDS, *track_ids)
        set_json_cached_key(redis_conn, CURRENT_PLAY_INDEXING, { 'slot': 14, 'timestamp': 1634836056 })
        index_listen_count_milestones(db, redis_conn)

        with db.scoped_session() as session:
            milestones = session.query(Milestone).filter(Milestone.slot==14).all()
            assert len(milestones) == 4
            sorted_milestones = sorted(milestones, key=lambda m: m.id)
            sorted_milestones = [(milestone.id, milestone.threshold) for milestone in sorted_milestones]

            assert sorted_milestones == [
                (1, 10),
                (2, 100),
                (4, 1000),
                (9, 5000)
            ]
