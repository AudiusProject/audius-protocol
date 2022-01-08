from datetime import datetime

import redis
from integration_tests.utils import populate_mock_db
from src.tasks.index_trending import (
    foorTime,
    get_should_update_trending,
    set_last_trending_datetime,
)
from src.utils.config import shared_config
from src.utils.db_session import get_db
from web3.types import BlockData

REDIS_URL = shared_config["redis"]["url"]


class MockEth:
    def __init__(self, return_block: BlockData):
        self.return_block = return_block

    def getBlock(self, *args):
        return self.return_block


class MockWeb3:
    def __init__(self, return_block):
        self.eth = MockEth(return_block)


def test_floor_time_60():
    assert foorTime(datetime(2012, 3, 16, 0, 0), 60 * 60) == datetime(2012, 3, 16, 0, 0)
    assert foorTime(datetime(2012, 3, 16, 0, 1), 60 * 60) == datetime(2012, 3, 16, 0, 0)
    assert foorTime(datetime(2012, 3, 16, 0, 59), 60 * 60) == datetime(
        2012, 3, 16, 0, 0
    )


def test_floor_time_15():
    assert foorTime(datetime(2012, 3, 16, 0, 0), 60 * 15) == datetime(2012, 3, 16, 0, 0)
    assert foorTime(datetime(2012, 3, 16, 0, 1), 60 * 15) == datetime(2012, 3, 16, 0, 0)
    assert foorTime(datetime(2012, 3, 16, 0, 14), 60 * 15) == datetime(
        2012, 3, 16, 0, 0
    )
    assert foorTime(datetime(2012, 3, 16, 0, 16), 60 * 15) == datetime(
        2012, 3, 16, 0, 15
    )
    assert foorTime(datetime(2012, 3, 16, 0, 31), 60 * 15) == datetime(
        2012, 3, 16, 0, 30
    )


def test_get_should_update_trending_hour_updates(app):
    last_trending_date = int(datetime(2012, 3, 16, 0, 0).timestamp())
    last_block_date = int(datetime(2012, 3, 16, 1, 5).timestamp())

    redis_conn = redis.Redis.from_url(url=REDIS_URL)
    set_last_trending_datetime(redis_conn, last_trending_date)
    with app.app_context():
        db = get_db()
    web3 = MockWeb3({"timestamp": last_block_date})

    # Add some users to the db so we have blocks
    entities = {
        "users": [{}] * 3,
    }
    populate_mock_db(db, entities)

    should_update = get_should_update_trending(db, web3, redis_conn, 60 * 60)
    assert should_update != None
    # Result is rounded
    assert datetime.fromtimestamp(should_update) == datetime(2012, 3, 16, 1, 0)


def test_get_should_update_trending_less_than_hour_no_update(app):
    last_trending_date = int(datetime(2012, 3, 16, 0, 0).timestamp())
    last_block_date = int(datetime(2012, 3, 16, 0, 1).timestamp())

    redis_conn = redis.Redis.from_url(url=REDIS_URL)
    set_last_trending_datetime(redis_conn, last_trending_date)
    with app.app_context():
        db = get_db()
    web3 = MockWeb3({"timestamp": last_block_date})

    # Add some users to the db so we have blocks
    entities = {
        "users": [{}] * 3,
    }
    populate_mock_db(db, entities)

    should_update = get_should_update_trending(db, web3, redis_conn, 60 * 60)
    assert should_update == None


def test_get_should_update_trending_fifteen_minutes(app):
    last_trending_date = int(datetime(2012, 3, 16, 0, 0).timestamp())
    last_block_date = int(datetime(2012, 3, 16, 0, 16).timestamp())

    redis_conn = redis.Redis.from_url(url=REDIS_URL)
    set_last_trending_datetime(redis_conn, last_trending_date)
    with app.app_context():
        db = get_db()
    web3 = MockWeb3({"timestamp": last_block_date})

    # Add some users to the db so we have blocks
    entities = {
        "users": [{}] * 3,
    }
    populate_mock_db(db, entities)

    should_update = get_should_update_trending(db, web3, redis_conn, 60 * 15)
    assert should_update != None
    # Result is rounded
    assert datetime.fromtimestamp(should_update) == datetime(2012, 3, 16, 0, 15)


def test_get_should_update_trending_less_fifteen_minutes_no_update(app):
    last_trending_date = int(datetime(2012, 3, 16, 0, 0).timestamp())
    last_block_date = int(datetime(2012, 3, 16, 0, 14).timestamp())

    redis_conn = redis.Redis.from_url(url=REDIS_URL)
    set_last_trending_datetime(redis_conn, last_trending_date)
    with app.app_context():
        db = get_db()
    web3 = MockWeb3({"timestamp": last_block_date})

    # Add some users to the db so we have blocks
    entities = {
        "users": [{}] * 3,
    }
    populate_mock_db(db, entities)

    should_update = get_should_update_trending(db, web3, redis_conn, 60 * 15)
    assert should_update == None
