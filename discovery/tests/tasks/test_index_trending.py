from datetime import datetime, timedelta

from web3.types import BlockData

from src.models.notifications.notification import Notification
from src.tasks.index_trending import (
    find_min_block_above_timestamp,
    floor_time,
    get_should_update_trending,
    index_trending,
    set_last_trending_datetime,
)
from src.utils.config import shared_config
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis
from tests.utils import populate_mock_db

REDIS_URL = shared_config["redis"]["url"]

BASE_TIME = datetime(2012, 3, 16, 0, 0)


class MockEth:
    def __init__(self, return_block: BlockData):
        self.return_block = return_block

    def get_block(self, *args):
        if len(args) == 2:
            hours_diff = args[0]
            datetime_val = BASE_TIME + timedelta(minutes=hours_diff)
            return {"timestamp": int(datetime_val.timestamp()), "number": hours_diff}

        return self.return_block


class MockWeb3:
    def __init__(self, return_block):
        self.eth = MockEth(return_block)


def test_floor_time_60():
    assert floor_time(BASE_TIME, 60 * 60) == datetime(2012, 3, 16, 0, 0)
    assert floor_time(datetime(2012, 3, 16, 0, 1), 60 * 60) == datetime(
        2012, 3, 16, 0, 0
    )
    assert floor_time(datetime(2012, 3, 16, 0, 59), 60 * 60) == datetime(
        2012, 3, 16, 0, 0
    )


def test_floor_time_15():
    assert floor_time(BASE_TIME, 60 * 15) == datetime(2012, 3, 16, 0, 0)
    assert floor_time(datetime(2012, 3, 16, 0, 1), 60 * 15) == datetime(
        2012, 3, 16, 0, 0
    )
    assert floor_time(datetime(2012, 3, 16, 0, 14), 60 * 15) == datetime(
        2012, 3, 16, 0, 0
    )
    assert floor_time(datetime(2012, 3, 16, 0, 16), 60 * 15) == datetime(
        2012, 3, 16, 0, 15
    )
    assert floor_time(datetime(2012, 3, 16, 0, 31), 60 * 15) == datetime(
        2012, 3, 16, 0, 30
    )


def test_get_should_update_trending_hour_updates(app):
    last_trending_date = int(BASE_TIME.timestamp())
    last_block_date = int(datetime(2012, 3, 16, 1, 5).timestamp())

    redis_conn = get_redis()
    set_last_trending_datetime(redis_conn, last_trending_date)
    with app.app_context():
        db = get_db()
    web3 = MockWeb3({"timestamp": last_block_date})

    # Add some users to the db so we have blocks
    entities = {
        "users": [{}] * 80,
    }
    populate_mock_db(db, entities)

    _, min_datetime = get_should_update_trending(db, web3, redis_conn, 60 * 60)
    assert min_datetime != None
    # Result is rounded
    assert datetime.fromtimestamp(min_datetime) == datetime(2012, 3, 16, 1, 0)


def test_get_should_update_trending_less_than_hour_no_update(app):
    last_trending_date = int(BASE_TIME.timestamp())
    last_block_date = int(datetime(2012, 3, 16, 0, 1).timestamp())

    redis_conn = get_redis()
    set_last_trending_datetime(redis_conn, last_trending_date)
    with app.app_context():
        db = get_db()
    web3 = MockWeb3({"timestamp": last_block_date})

    # Add some users to the db so we have blocks
    entities = {
        "users": [{}] * 20,
    }
    populate_mock_db(db, entities)

    min_block, min_datetime = get_should_update_trending(db, web3, redis_conn, 60 * 60)
    assert min_block == None
    assert min_datetime == None


def test_get_should_update_trending_fifteen_minutes(app):
    last_trending_date = int(BASE_TIME.timestamp())
    last_block_date = int(datetime(2012, 3, 16, 0, 16).timestamp())

    redis_conn = get_redis()
    set_last_trending_datetime(redis_conn, last_trending_date)
    with app.app_context():
        db = get_db()
    web3 = MockWeb3({"timestamp": last_block_date})

    # Add some users to the db so we have blocks
    entities = {
        "users": [{}] * 24,
    }
    populate_mock_db(db, entities)

    _, min_datetime = get_should_update_trending(db, web3, redis_conn, 60 * 15)
    assert min_datetime != None
    # Result is rounded
    assert datetime.fromtimestamp(min_datetime) == datetime(2012, 3, 16, 0, 15)


def test_get_should_update_trending_less_fifteen_minutes_no_update(app):
    last_trending_date = int(BASE_TIME.timestamp())
    last_block_date = int(datetime(2012, 3, 16, 0, 14).timestamp())

    redis_conn = get_redis()
    set_last_trending_datetime(redis_conn, last_trending_date)
    with app.app_context():
        db = get_db()
    web3 = MockWeb3({"timestamp": last_block_date})

    # Add some users to the db so we have blocks
    entities = {
        "users": [{}] * 12,
    }
    populate_mock_db(db, entities)

    min_block, min_datetime = get_should_update_trending(db, web3, redis_conn, 60 * 15)
    assert min_block == None
    assert min_datetime == None


def test_find_min_block_above_timestamp(app):
    """
    Test that given a current blocknumber and min_timestamp,
    the find_min_block_above_timestamp function should iterate
    until it finds the min blocknumber at or above the timestamp
    """

    # Add some users to the db - wihch generates that number of blocks
    entities = {
        "users": [{}] * 180,
    }
    with app.app_context():
        db = get_db()

        populate_mock_db(db, entities)

    block_number = 100
    min_timestamp = BASE_TIME + timedelta(minutes=20)
    web3 = MockWeb3({})

    min_block = find_min_block_above_timestamp(block_number, min_timestamp, web3)
    assert min_block["number"] == 20


def test_index_trending(app, mocker):
    mocker.patch(
        "src.tasks.index_trending._get_underground_trending_with_session",
        return_value=[{"track_id": 3, "owner_id": 2}],
    )
    # Add some users to the db - wihch generates that number of blocks
    entities = {
        "users": [{"user_id": i} for i in range(10)],
        "tracks": [{"track_id": i, "owner_id": 3} for i in range(10)],
        "saves": [
            {"save_item_id": 6, "user_id": i, "repost_type": "track"} for i in range(20)
        ],
    }
    last_trending_date = int(BASE_TIME.timestamp())

    redis_conn = get_redis()

    with app.app_context():
        db = get_db()

        populate_mock_db(db, entities)
        index_trending({}, db, redis_conn, last_trending_date)
        with db.scoped_session() as session:
            trending_notifications = (
                session.query(Notification)
                .filter(Notification.type == "trending")
                .all()
            )
            tastemaker_notifications = (
                session.query(Notification)
                .filter(Notification.type == "tastemaker")
                .all()
            )

            assert len(trending_notifications) == 5
            # should rank tranks 9-5 as rank 1-5
            for i, notification in enumerate(trending_notifications):
                assert notification.specifier == f"{10-i-1}"
                assert notification.data["rank"] == i + 1

            assert len(tastemaker_notifications) == 10
            for i, notification in enumerate(tastemaker_notifications):
                assert (
                    notification.group_id
                    == f"tastemaker_user_id:{i}:tastemaker_item_id:6"
                )
