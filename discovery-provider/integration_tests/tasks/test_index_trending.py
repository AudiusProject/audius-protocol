from datetime import datetime, timedelta

import redis
from integration_tests.utils import populate_mock_db
from src.tasks.index_trending import (
    find_min_block_above_timestamp,
    floor_time,
    get_should_update_trending,
    set_last_trending_datetime,
)
from src.utils.config import shared_config
from src.utils.db_session import get_db
from web3.types import BlockData

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

    redis_conn = redis.Redis.from_url(url=REDIS_URL)
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

    redis_conn = redis.Redis.from_url(url=REDIS_URL)
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

    redis_conn = redis.Redis.from_url(url=REDIS_URL)
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

    redis_conn = redis.Redis.from_url(url=REDIS_URL)
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
