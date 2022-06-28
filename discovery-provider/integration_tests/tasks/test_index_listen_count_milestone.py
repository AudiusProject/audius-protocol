from datetime import datetime
from typing import Optional

from integration_tests.utils import populate_mock_db
from src.models.notifications.milestone import Milestone
from src.utils.config import shared_config
from src.utils.db_session import get_db

REDIS_URL = shared_config["redis"]["url"]
DEFAULT_EVENT = ""

milestone_threshold = [
    10,
    25,
    50,
    100,
    250,
    500,
    1000,
    5000,
    10000,
    20000,
    50000,
    100000,
    1000000,
]
next_threshold = dict(zip(milestone_threshold[:-1], milestone_threshold[1:]))


def get_next_track_milestone(play_count: int, prev_milestone: Optional[int] = None):
    """
    Gets the next hightest milstone threshold avaiable given the play count,
    if past the last threshold or given an invalid previous milestone, will return None
    """
    next_milestone = milestone_threshold[0]
    if prev_milestone:
        if prev_milestone in next_threshold:
            next_milestone = next_threshold[prev_milestone]
        else:
            # track is past the last milestone, so return none and stop
            return None

    # If play counts have not passed the next threshold, return None
    if play_count < next_milestone:
        return None

    # If play counts have pasted the next milestone threshold, continue to compare against higher thresholds
    next_next_milestone = (
        next_threshold[next_milestone] if next_milestone in next_threshold else None
    )
    while next_next_milestone and play_count >= next_next_milestone:
        next_milestone = next_next_milestone
        next_next_milestone = (
            next_threshold[next_milestone] if next_milestone in next_threshold else None
        )

    return next_milestone


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


def test_listen_count_milestone_processing(app):
    with app.app_context():
        db = get_db()

        test_entities = {
            "plays": [{"item_id": 1} for _ in range(8)]
            + [
                {
                    "item_id": 2,
                    "created_at": datetime.fromtimestamp(1634836054),
                    "slot": 12,
                }
                for _ in range(10)
            ]  # milestone 10
            + [
                {
                    "item_id": 3,
                    "created_at": datetime.fromtimestamp(1634836054),
                    "slot": 12,
                }
                for _ in range(11)
            ]  # milestone 10
            + [
                {
                    "item_id": 4,
                    "created_at": datetime.fromtimestamp(1634836054),
                    "slot": 12,
                }
                for _ in range(12)
            ]  # milestone 10
            + [
                {
                    "item_id": 5,
                    "created_at": datetime.fromtimestamp(1634836054),
                    "slot": 12,
                }
                for _ in range(25)
            ]  # milestone 25
            + [
                {
                    "item_id": 6,
                    "created_at": datetime.fromtimestamp(1634836054),
                    "slot": 12,
                }
                for _ in range(27)
            ]  # milestone 25
            + [
                {
                    "item_id": 7,
                    "created_at": datetime.fromtimestamp(1634836054),
                    "slot": 12,
                }
                for _ in range(40)
            ]  # milestone 25
            + [
                {
                    "item_id": 8,
                    "created_at": datetime.fromtimestamp(1634836054),
                    "slot": 12,
                }
                for _ in range(80)
            ]  # milestone 50
            + [
                {
                    "item_id": 9,
                    "created_at": datetime.fromtimestamp(1634836054),
                    "slot": 12,
                }
                for _ in range(111)
            ]  # milestone 100
            + [
                {
                    "item_id": 10,
                    "created_at": datetime.fromtimestamp(1634836054),
                    "slot": 12,
                }
                for _ in range(25)
            ]  # milestone 25
        }
        populate_mock_db(db, test_entities)

        with db.scoped_session() as session:
            milestones = session.query(Milestone).all()
            assert len(milestones) == 18
            sorted_milestones = sorted(milestones, key=lambda m: (m.id, m.threshold))
            sorted_milestones = [
                (milestone.id, milestone.threshold, milestone.slot, milestone.timestamp)
                for milestone in sorted_milestones
            ]

            assert sorted_milestones == [
                (2, 10, 12, datetime.fromtimestamp(1634836054)),
                (3, 10, 12, datetime.fromtimestamp(1634836054)),
                (4, 10, 12, datetime.fromtimestamp(1634836054)),
                (5, 10, 12, datetime.fromtimestamp(1634836054)),
                (5, 25, 12, datetime.fromtimestamp(1634836054)),
                (6, 10, 12, datetime.fromtimestamp(1634836054)),
                (6, 25, 12, datetime.fromtimestamp(1634836054)),
                (7, 10, 12, datetime.fromtimestamp(1634836054)),
                (7, 25, 12, datetime.fromtimestamp(1634836054)),
                (8, 10, 12, datetime.fromtimestamp(1634836054)),
                (8, 25, 12, datetime.fromtimestamp(1634836054)),
                (8, 50, 12, datetime.fromtimestamp(1634836054)),
                (9, 10, 12, datetime.fromtimestamp(1634836054)),
                (9, 25, 12, datetime.fromtimestamp(1634836054)),
                (9, 50, 12, datetime.fromtimestamp(1634836054)),
                (9, 100, 12, datetime.fromtimestamp(1634836054)),
                (10, 10, 12, datetime.fromtimestamp(1634836054)),
                (10, 25, 12, datetime.fromtimestamp(1634836054)),
            ]

        test_entities = {
            "plays": [
                {"item_id": 1, "id": 1000 + i, "slot": 14} for i in range(3)
            ]  # 3 + 8 = 11 new
            + [
                {"item_id": 2, "id": 1200 + i, "slot": 14} for i in range(100)
            ]  # 10 + 100 = 110 new
            + [
                {"item_id": 3, "id": 1400 + i, "slot": 14} for i in range(10)
            ]  # 10 + 11 = 21 not new
            + [
                {"item_id": 4, "id": 1600 + i, "slot": 14} for i in range(1000)
            ]  # 1000 + 12 = 1012 new
            + [
                {"item_id": 8, "id": 3000 + i, "slot": 14} for i in range(19)
            ]  # 19 + 80 = 99 not new
            + [
                {"item_id": 9, "id": 9000 + i, "slot": 14} for i in range(5000)
            ]  # 5000 + 111 = 5111 new
        }
        populate_mock_db(db, test_entities)

        with db.scoped_session() as session:
            milestones = session.query(Milestone).filter(Milestone.slot == 14).all()
            assert len(milestones) == 14
            sorted_milestones = sorted(milestones, key=lambda m: (m.id, m.threshold))
            sorted_milestones = [
                (milestone.id, milestone.threshold) for milestone in sorted_milestones
            ]

            assert sorted_milestones == [
                (1, 10),
                (2, 25),
                (2, 50),
                (2, 100),
                (4, 25),
                (4, 50),
                (4, 100),
                (4, 250),
                (4, 500),
                (4, 1000),
                (9, 250),
                (9, 500),
                (9, 1000),
                (9, 5000),
            ]
