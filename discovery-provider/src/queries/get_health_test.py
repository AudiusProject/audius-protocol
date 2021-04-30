import os
from unittest.mock import MagicMock
from hexbytes import HexBytes
from src.utils.redis_constants import \
    latest_block_hash_redis_key, latest_block_redis_key, \
    most_recent_indexed_block_hash_redis_key, most_recent_indexed_block_redis_key
from src.models import Block
from src.queries.get_health import get_health, get_block_confirmation


def test_get_health(web3_mock, redis_mock, db_mock):
    """Tests that the health check returns db data"""
    # Set up web3 eth
    def getBlock(_u1, _u2):  # unused
        block = MagicMock()
        block.number = 2
        block.hash = HexBytes(b"\x02")
        return block
    web3_mock.eth.getBlock = getBlock

    # Set up db state
    with db_mock.scoped_session() as session:
        Block.__table__.create(db_mock._engine)
        session.add(Block(
            blockhash='0x01',
            number=1,
            parenthash='0x01',
            is_current=True,
        ))

    args = {}
    health_results, error = get_health(args)

    assert error == False

    assert health_results["web"]["blocknumber"] == 2
    assert health_results["web"]["blockhash"] == "0x02"
    assert health_results["db"]["number"] == 1
    assert health_results["db"]["blockhash"] == "0x01"
    assert health_results["block_difference"] == 1

    assert "maximum_healthy_block_difference" in health_results
    assert "version" in health_results
    assert "service" in health_results


def test_get_health_using_redis(web3_mock, redis_mock, db_mock):
    """Tests that the health check returns redis data first"""
    # Set up web3 eth
    def getBlock(_u1, _u2):  # unused
        block = MagicMock()
        block.number = 2
        block.hash = HexBytes(b"\x02")
        return block
    web3_mock.eth.getBlock = getBlock

    # Set up redis state
    redis_mock.set(latest_block_redis_key, '3')
    redis_mock.set(latest_block_hash_redis_key, '0x3')
    redis_mock.set(most_recent_indexed_block_redis_key, '2')
    redis_mock.set(most_recent_indexed_block_hash_redis_key, '0x02')

    # Set up db state
    with db_mock.scoped_session() as session:
        Block.__table__.create(db_mock._engine)
        session.add(Block(
            blockhash='0x01',
            number=1,
            parenthash='0x01',
            is_current=True,
        ))

    args = {}
    health_results, error = get_health(args)

    assert error == False

    assert health_results["web"]["blocknumber"] == 3
    assert health_results["web"]["blockhash"] == "0x3"
    assert health_results["db"]["number"] == 2
    assert health_results["db"]["blockhash"] == "0x02"
    assert health_results["block_difference"] == 1

    assert "maximum_healthy_block_difference" in health_results
    assert "version" in health_results
    assert "service" in health_results


def test_get_health_partial_redis(web3_mock, redis_mock, db_mock):
    """Tests that the health check returns db data if redis data is only partial"""
    # Set up web3 eth
    def getBlock(_u1, _u2):  # unused
        block = MagicMock()
        block.number = 2
        block.hash = HexBytes(b"\x02")
        return block
    web3_mock.eth.getBlock = getBlock

    # Set up redis state
    redis_mock.set(latest_block_redis_key, '3')
    redis_mock.set(most_recent_indexed_block_redis_key, '2')

    # Set up db state
    with db_mock.scoped_session() as session:
        Block.__table__.create(db_mock._engine)
        session.add(Block(
            blockhash='0x01',
            number=1,
            parenthash='0x01',
            is_current=True,
        ))

    args = {}
    health_results, error = get_health(args)

    assert error == False

    assert health_results["web"]["blocknumber"] == 2
    assert health_results["web"]["blockhash"] == "0x02"
    assert health_results["db"]["number"] == 1
    assert health_results["db"]["blockhash"] == "0x01"
    assert health_results["block_difference"] == 1

    assert "maximum_healthy_block_difference" in health_results
    assert "version" in health_results
    assert "service" in health_results


def test_get_health_with_invalid_db_state(web3_mock, redis_mock, db_mock):
    """Tests that the health check can handle an invalid block in the db"""
    # Set up web3 eth
    def getBlock(_u1, _u2):  # unused
        block = MagicMock()
        block.number = 2
        block.hash = HexBytes(b"\x02")
        return block
    web3_mock.eth.getBlock = getBlock

    # Set up db state
    with db_mock.scoped_session() as session:
        Block.__table__.create(db_mock._engine)
        session.add(Block(
            blockhash='0x01',
            number=None, # NoneType
            parenthash='0x01',
            is_current=True,
        ))

    args = {}
    health_results, error = get_health(args)

    assert error == False

    assert health_results["web"]["blocknumber"] == 2
    assert health_results["web"]["blockhash"] == "0x02"
    assert health_results["db"]["number"] == 0
    assert health_results["db"]["blockhash"] == "0x01"
    assert health_results["block_difference"] == 2

    assert "maximum_healthy_block_difference" in health_results
    assert "version" in health_results
    assert "service" in health_results


def test_get_health_skip_redis(web3_mock, redis_mock, db_mock):
    """Tests that the health check skips returnning redis data first if explicitly disabled"""
    # Set up web3 eth
    def getBlock(_u1, _u2):  # unused
        block = MagicMock()
        block.number = 2
        block.hash = HexBytes(b"\x02")
        return block
    web3_mock.eth.getBlock = getBlock

    # Set up redis state
    redis_mock.set(latest_block_redis_key, '3')
    redis_mock.set(latest_block_hash_redis_key, '0x3')
    redis_mock.set(most_recent_indexed_block_redis_key, '2')
    redis_mock.set(most_recent_indexed_block_hash_redis_key, '0x02')

    # Set up db state
    with db_mock.scoped_session() as session:
        Block.__table__.create(db_mock._engine)
        session.add(Block(
            blockhash='0x01',
            number=1,
            parenthash='0x01',
            is_current=True,
        ))

    args = {}
    health_results, error = get_health(args, use_redis_cache=False)

    assert error == False

    assert health_results["web"]["blocknumber"] == 2
    assert health_results["web"]["blockhash"] == "0x02"
    assert health_results["db"]["number"] == 1
    assert health_results["db"]["blockhash"] == "0x01"
    assert health_results["block_difference"] == 1

    assert "maximum_healthy_block_difference" in health_results
    assert "version" in health_results
    assert "service" in health_results


def test_get_health_unhealthy_block_difference(web3_mock, redis_mock, db_mock):
    """Tests that the health check an unhealthy block difference"""
    # Set up web3 eth
    def getBlock(_u1, _u2):  # unused
        block = MagicMock()
        block.number = 50
        block.hash = HexBytes(b"\x50")
        return block
    web3_mock.eth.getBlock = getBlock

    # Set up db state
    with db_mock.scoped_session() as session:
        Block.__table__.create(db_mock._engine)
        session.add(Block(
            blockhash='0x01',
            number=1,
            parenthash='0x01',
            is_current=True,
        ))

    args = {
        "enforce_block_diff": True,
        "healthy_block_diff": 40
    }
    health_results, error = get_health(args)

    assert error == True

    assert health_results["web"]["blocknumber"] == 50
    assert health_results["web"]["blockhash"] == "0x50"
    assert health_results["db"]["number"] == 1
    assert health_results["db"]["blockhash"] == "0x01"
    assert health_results["block_difference"] == 49

    assert "maximum_healthy_block_difference" in health_results
    assert "version" in health_results
    assert "service" in health_results


def test_get_health_with_monitors(web3_mock, redis_mock, db_mock, get_monitors_mock):
    """Tests that the health check returns monitor data"""
    get_monitors_mock.return_value = {
        'database_connections': 2,
        'filesystem_size': 62725623808,
        'filesystem_used': 50381168640,
        'received_bytes_per_sec': 7942.038197103973,
        'total_memory': 6237151232,
        'used_memory': 3055149056,
        'transferred_bytes_per_sec': 7340.780857447676
    }

    # Set up web3 eth
    def getBlock(_u1, _u2):  # unused
        block = MagicMock()
        block.number = 2
        block.hash = HexBytes(b"\x02")
        return block
    web3_mock.eth.getBlock = getBlock

    # Set up db state
    with db_mock.scoped_session() as session:
        Block.__table__.create(db_mock._engine)
        session.add(Block(
            blockhash='0x01',
            number=1,
            parenthash='0x01',
            is_current=True,
        ))

    args = {}
    health_results, error = get_health(args)
    assert error == False
    assert health_results['database_connections'] == 2
    assert health_results['filesystem_size'] == 62725623808
    assert health_results['filesystem_used'] == 50381168640
    assert health_results['received_bytes_per_sec'] == 7942.038197103973
    assert health_results['total_memory'] == 6237151232
    assert health_results['used_memory'] == 3055149056
    assert health_results['transferred_bytes_per_sec'] == 7340.780857447676
    assert health_results['number_of_cpus'] == os.cpu_count()

def test_get_health_verbose(web3_mock, redis_mock, db_mock, get_monitors_mock):
    """Tests that the health check returns verbose db stats"""
    get_monitors_mock.return_value = {
        'database_connections': 2,
        'database_connection_info': [{
            'datname': 'audius_discovery',
            'state': 'idle',
            'query': 'COMMIT',
            'wait_event_type': 'Client',
            'wait_event': 'ClientRead'
        }]
    }

    # Set up web3 eth
    def getBlock(_u1, _u2):  # unused
        block = MagicMock()
        block.number = 2
        block.hash = HexBytes(b"\x02")
        return block
    web3_mock.eth.getBlock = getBlock

    # Set up db state
    with db_mock.scoped_session() as session:
        Block.__table__.create(db_mock._engine)
        session.add(Block(
            blockhash='0x01',
            number=1,
            parenthash='0x01',
            is_current=True,
        ))

    args = {
        "verbose": True
    }
    health_results, error = get_health(args)

    assert error == False

    assert health_results["web"]["blocknumber"] == 2
    assert health_results["web"]["blockhash"] == "0x02"
    assert health_results["db"]["number"] == 1
    assert health_results["db"]["blockhash"] == "0x01"
    assert health_results["block_difference"] == 1

    assert health_results["db_connections"]["database_connections"] == 2
    assert health_results["db_connections"]["database_connection_info"] == [{
        'datname': 'audius_discovery',
        'state': 'idle',
        'query': 'COMMIT',
        'wait_event_type': 'Client',
        'wait_event': 'ClientRead'
    }]

    assert "maximum_healthy_block_difference" in health_results
    assert "version" in health_results
    assert "service" in health_results

def test_get_block_confirmation(web3_mock, redis_mock, db_mock):
    """Tests confirmation of block given a blockhash and a blocknumber"""

    # Set up db state
    blockhash, blocknumber = '0x01', 1
    latest_blockhash, latest_blocknumber = '0x02', 2
    with db_mock.scoped_session() as session:
        Block.__table__.create(db_mock._engine)
        session.add(Block(
            blockhash='0x00',
            number=0,
            parenthash=None,
            is_current=False,
        ))
        session.add(Block(
            blockhash=blockhash,
            number=blocknumber,
            parenthash='0x00',
            is_current=False,
        ))
        session.add(Block(
            blockhash=latest_blockhash,
            number=latest_blocknumber,
            parenthash=blockhash,
            is_current=True,
        ))

    block_confirmation = get_block_confirmation(blockhash, blocknumber)
    assert block_confirmation['block_found'] == True
    assert block_confirmation['block_passed'] == True

    latest_block_confirmation = get_block_confirmation(latest_blockhash, latest_blocknumber)
    assert latest_block_confirmation['block_found'] == True
    assert latest_block_confirmation['block_passed'] == True

    new_block_confirmation = get_block_confirmation('0xfe', 2)
    assert new_block_confirmation['block_found'] == False
    assert new_block_confirmation['block_passed'] == True

    new_block_confirmation = get_block_confirmation('0xff', 3)
    assert new_block_confirmation['block_found'] == False
    assert new_block_confirmation['block_passed'] == False
