import json
import os
from datetime import datetime, timezone
from time import time

from src.models.indexing.block import Block
from src.models.indexing.indexing_checkpoints import IndexingCheckpoint
from src.queries.get_health import get_health
from src.utils.core import (
    CoreHealth,
    core_health_check_cache_key,
    core_listens_health_check_cache_key,
)
from src.utils.redis_constants import (
    TRACK_DELIST_DISCREPANCIES_KEY,
    TRACK_DELIST_DISCREPANCIES_TIMESTAMP_KEY,
    TRACK_DELIST_STATUS_CURSOR_CHECK_KEY,
    TRACK_DELIST_STATUS_CURSOR_CHECK_TIMESTAMP_KEY,
    USER_DELIST_DISCREPANCIES_KEY,
    USER_DELIST_DISCREPANCIES_TIMESTAMP_KEY,
    USER_DELIST_STATUS_CURSOR_CHECK_KEY,
    USER_DELIST_STATUS_CURSOR_CHECK_TIMESTAMP_KEY,
    challenges_last_processed_event_redis_key,
    latest_block_hash_redis_key,
    latest_block_redis_key,
    latest_legacy_play_db_key,
    latest_sol_play_db_tx_key,
    latest_sol_play_program_tx_key,
    most_recent_indexed_block_hash_redis_key,
    most_recent_indexed_block_redis_key,
    oldest_unarchived_play_key,
)


def cache_core_health_vars(redis_mock, health: CoreHealth):
    redis_mock.set(core_health_check_cache_key, json.dumps(health))


def cache_core_listens_health_vars(redis_mock, latest_chain_slot: int):
    """Cache core listens health data with latest_chain_slot"""
    listens_health = {
        "latest_chain_slot": latest_chain_slot,
        "latest_indexed_slot": latest_chain_slot,
        "slot_diff": 0,
        "time_diff": 2.0,
        "sol_slot_cutover": 315925000,
        "core_block_cutover": 113180,
        "tx_info": {
            "chain_tx": None,
            "db_tx": {
                "signature": "",
                "slot": latest_chain_slot,
                "timestamp": 1750716115,
            },
        },
    }
    redis_mock.set(core_listens_health_check_cache_key, json.dumps(listens_health))


# Cache values as expected in redis
def cache_play_health_vars(redis_mock):
    # Set latest processed
    redis_mock.set(
        latest_sol_play_db_tx_key,
        json.dumps(
            {
                "timestamp": 1635477758,
                "slot": 12,
                "signature": "5SD9fJhsuMKb1dnJtKszoLLHGve5qmubTvfJX6eLQKRT71XWXkAGXw5faj2uJPhqngzT2V4zucocGiyXYXYMv7QK",
            }
        ),
    )
    # Set latest legacy
    redis_mock.set(latest_legacy_play_db_key, 1632885758)

    # Set oldest unarchived play
    redis_mock.set(oldest_unarchived_play_key, 1517513432)

    # Set latest chain tx
    redis_mock.set(
        latest_sol_play_program_tx_key,
        json.dumps(
            {
                "signature": "5SD9fJhsuMKb1dnJtKszoLLHGve5qmubTvfJX6eLQKRT71XWXkAGXw5faj2uJPhqngzT2V4zucocGiyXYXYMv7QK",
                "slot": 15,
                "timestamp": 1635477758,
            }
        ),
    )


def cache_trusted_notifier_discrepancies_vars(redis_mock):
    redis_mock.set(
        USER_DELIST_STATUS_CURSOR_CHECK_TIMESTAMP_KEY,
        datetime.now(timezone.utc).timestamp(),
    )
    redis_mock.set(USER_DELIST_STATUS_CURSOR_CHECK_KEY, "ok")
    redis_mock.set(
        TRACK_DELIST_STATUS_CURSOR_CHECK_TIMESTAMP_KEY,
        datetime.now(timezone.utc).timestamp(),
    )
    redis_mock.set(TRACK_DELIST_STATUS_CURSOR_CHECK_KEY, "ok")
    redis_mock.set(
        USER_DELIST_DISCREPANCIES_TIMESTAMP_KEY,
        datetime.now(timezone.utc).timestamp(),
    )
    redis_mock.set(USER_DELIST_DISCREPANCIES_KEY, "[]")
    redis_mock.set(
        TRACK_DELIST_DISCREPANCIES_TIMESTAMP_KEY,
        datetime.now(timezone.utc).timestamp(),
    )
    redis_mock.set(TRACK_DELIST_DISCREPANCIES_KEY, "[]")


def test_get_health(redis_mock, db_mock, mock_requests):
    """Tests that the health check returns db data"""

    cache_play_health_vars(redis_mock)
    cache_trusted_notifier_discrepancies_vars(redis_mock)
    redis_mock.set(latest_block_redis_key, "2")

    cache_core_health_vars(
        redis_mock=redis_mock,
        health={
            "chain_id": "audius-devnet",
            "indexing_entity_manager": True,
            "indexing_plays": True,
            "latest_chain_block": 2,
            "latest_indexed_block": 1,
        },
    )

    # Cache core listens health data for the new logic
    cache_core_listens_health_vars(redis_mock, 2)

    # Set up db state
    with db_mock.scoped_session() as session:
        Block.__table__.create(db_mock._engine)
        session.add(
            Block(
                blockhash="0x01",
                number=1,
                parenthash="0x01",
                is_current=True,
            )
        )

    args = {}
    health_results, _ = get_health(args)

    assert health_results["web"]["blocknumber"] == 2
    assert health_results["db"]["number"] == 1
    assert health_results["block_difference"] == 1

    assert "maximum_healthy_block_difference" in health_results
    assert "version" in health_results
    assert "service" in health_results


def test_get_health_using_redis(redis_mock, db_mock, mock_requests):
    """Tests that the health check returns redis data first"""

    cache_play_health_vars(redis_mock)
    cache_trusted_notifier_discrepancies_vars(redis_mock)

    cache_core_health_vars(
        redis_mock=redis_mock,
        health={
            "chain_id": "audius-devnet",
            "indexing_entity_manager": True,
            "indexing_plays": True,
            "latest_chain_block": 3,
            "latest_indexed_block": 2,
        },
    )

    # Cache core listens health data for the new logic
    cache_core_listens_health_vars(redis_mock, 3)

    # Set up redis state
    redis_mock.set(latest_block_redis_key, "3")
    redis_mock.set(latest_block_hash_redis_key, "0x3")
    redis_mock.set(most_recent_indexed_block_redis_key, "2")
    redis_mock.set(most_recent_indexed_block_hash_redis_key, "0x02")

    # Set up db state
    with db_mock.scoped_session() as session:
        Block.__table__.create(db_mock._engine)
        session.add(
            Block(
                blockhash="0x01",
                number=1,
                parenthash="0x01",
                is_current=True,
            )
        )

    args = {}
    health_results, _ = get_health(args)

    assert health_results["web"]["blocknumber"] == 3
    assert health_results["db"]["number"] == 2
    assert health_results["block_difference"] == 1

    assert "maximum_healthy_block_difference" in health_results
    assert "version" in health_results
    assert "service" in health_results


def test_get_health_partial_redis(redis_mock, db_mock, mock_requests):
    """Tests that the health check returns db data if redis data is only partial"""

    cache_play_health_vars(redis_mock)
    cache_trusted_notifier_discrepancies_vars(redis_mock)

    cache_core_health_vars(
        redis_mock=redis_mock,
        health={
            "chain_id": "audius-devnet",
            "indexing_entity_manager": True,
            "indexing_plays": True,
            "latest_chain_block": 2,
            "latest_indexed_block": 1,
        },
    )

    # Cache core listens health data for the new logic
    cache_core_listens_health_vars(redis_mock, 3)

    # Set up redis state
    redis_mock.set(latest_block_redis_key, "3")
    redis_mock.set(most_recent_indexed_block_redis_key, "2")

    # Set up db state
    with db_mock.scoped_session() as session:
        Block.__table__.create(db_mock._engine)
        session.add(
            Block(
                blockhash="0x01",
                number=1,
                parenthash="0x01",
                is_current=True,
            )
        )

    args = {}
    health_results, _ = get_health(args)

    assert health_results["web"]["blocknumber"] == 3
    assert health_results["db"]["number"] == 1
    assert health_results["block_difference"] == 2

    assert "maximum_healthy_block_difference" in health_results
    assert "version" in health_results
    assert "service" in health_results


def test_get_health_with_invalid_db_state(redis_mock, db_mock, mock_requests):
    """Tests that the health check can handle an invalid block in the db"""

    cache_play_health_vars(redis_mock)
    cache_trusted_notifier_discrepancies_vars(redis_mock)
    redis_mock.set(latest_block_redis_key, "2")

    cache_core_health_vars(
        redis_mock=redis_mock,
        health={
            "chain_id": "audius-devnet",
            "indexing_entity_manager": True,
            "indexing_plays": True,
            "latest_chain_block": 2,
        },
    )

    # Cache core listens health data for the new logic
    cache_core_listens_health_vars(redis_mock, 2)

    # Set up db state
    with db_mock.scoped_session() as session:
        Block.__table__.create(db_mock._engine)
        session.add(
            Block(
                blockhash="0x01",
                number=None,  # NoneType
                parenthash="0x01",
                is_current=True,
            )
        )

    args = {}
    health_results, _ = get_health(args)

    assert health_results["web"]["blocknumber"] == 2
    assert health_results["db"]["number"] == 0
    assert health_results["block_difference"] == 2

    assert "maximum_healthy_block_difference" in health_results
    assert "version" in health_results
    assert "service" in health_results


def test_get_health_skip_redis(redis_mock, db_mock, mock_requests):
    """Tests that the health check skips returning redis data first if explicitly disabled"""

    cache_play_health_vars(redis_mock)
    cache_trusted_notifier_discrepancies_vars(redis_mock)

    # Set up redis state
    redis_mock.set(latest_block_redis_key, "3")
    redis_mock.set(latest_block_hash_redis_key, "0x3")
    redis_mock.set(most_recent_indexed_block_redis_key, "2")
    redis_mock.set(most_recent_indexed_block_hash_redis_key, "0x02")

    cache_core_health_vars(
        redis_mock=redis_mock,
        health={
            "chain_id": "audius-devnet",
            "indexing_entity_manager": True,
            "indexing_plays": True,
            "latest_chain_block": 2,
            "latest_indexed_block": 1,
        },
    )

    # Cache core listens health data for the new logic
    cache_core_listens_health_vars(redis_mock, 3)

    # Set up db state
    with db_mock.scoped_session() as session:
        Block.__table__.create(db_mock._engine)
        session.add(
            Block(
                blockhash="0x01",
                number=1,
                parenthash="0x01",
                is_current=True,
            )
        )

    args = {}
    health_results, _ = get_health(args, use_redis_cache=False)

    assert health_results["web"]["blocknumber"] == 3
    assert health_results["db"]["number"] == 1
    assert health_results["block_difference"] == 2

    assert "maximum_healthy_block_difference" in health_results
    assert "version" in health_results
    assert "service" in health_results


def test_get_health_unhealthy_block_difference(redis_mock, db_mock, mock_requests):
    """Tests that the health check an unhealthy block difference"""

    cache_play_health_vars(redis_mock)
    cache_trusted_notifier_discrepancies_vars(redis_mock)
    redis_mock.set(latest_block_redis_key, "50")
    cache_core_health_vars(
        redis_mock=redis_mock,
        health={
            "chain_id": "audius-devnet",
            "indexing_entity_manager": True,
            "indexing_plays": True,
            "latest_chain_block": 50,
            "latest_indexed_block": 1,
        },
    )

    # Cache core listens health data for the new logic
    cache_core_listens_health_vars(redis_mock, 50)

    # Set up db state
    with db_mock.scoped_session() as session:
        Block.__table__.create(db_mock._engine)
        session.add(
            Block(
                blockhash="0x01",
                number=1,
                parenthash="0x01",
                is_current=True,
            )
        )

    args = {"enforce_block_diff": True, "healthy_block_diff": 40}
    health_results, error = get_health(args)

    assert error == True

    assert health_results["web"]["blocknumber"] == 50
    assert health_results["db"]["number"] == 1
    assert health_results["block_difference"] == 49

    assert "maximum_healthy_block_difference" in health_results
    assert "version" in health_results
    assert "service" in health_results


def test_get_health_with_monitors(
    redis_mock, db_mock, get_monitors_mock, mock_requests
):
    """Tests that the health check returns monitor data"""
    get_monitors_mock.return_value = {
        "database_connections": 2,
        "filesystem_size": 62725623808,
        "filesystem_used": 50381168640,
        "received_bytes_per_sec": 7942.038197103973,
        "total_memory": 6237151232,
        "used_memory": 3055149056,
        "transferred_bytes_per_sec": 7340.780857447676,
    }

    cache_play_health_vars(redis_mock)
    cache_trusted_notifier_discrepancies_vars(redis_mock)

    # Set up db state
    with db_mock.scoped_session() as session:
        Block.__table__.create(db_mock._engine)
        session.add(
            Block(
                blockhash="0x01",
                number=1,
                parenthash="0x01",
                is_current=True,
            )
        )

    args = {}
    health_results, _ = get_health(args)
    assert health_results["database_connections"] == 2
    assert health_results["filesystem_size"] == 62725623808
    assert health_results["filesystem_used"] == 50381168640
    assert health_results["received_bytes_per_sec"] == 7942.038197103973
    assert health_results["total_memory"] == 6237151232
    assert health_results["used_memory"] == 3055149056
    assert health_results["transferred_bytes_per_sec"] == 7340.780857447676
    assert health_results["number_of_cpus"] == os.cpu_count()


def test_get_health_verbose(redis_mock, db_mock, get_monitors_mock, mock_requests):
    """Tests that the health check returns verbose db stats"""
    get_monitors_mock.return_value = {
        "database_connections": 2,
        "filesystem_size": 62725623808,
        "filesystem_used": 50381168640,
        "received_bytes_per_sec": 7942.038197103973,
        "total_memory": 6237151232,
        "used_memory": 3055149056,
        "transferred_bytes_per_sec": 7340.780857447676,
        "database_connection_info": [
            {
                "datname": "audius_discovery",
                "state": "idle",
                "query": "COMMIT",
                "wait_event_type": "Client",
                "wait_event": "ClientRead",
            }
        ],
    }

    cache_play_health_vars(redis_mock)
    cache_trusted_notifier_discrepancies_vars(redis_mock)
    redis_mock.set(latest_block_redis_key, "2")

    cache_core_health_vars(
        redis_mock=redis_mock,
        health={
            "chain_id": "audius-devnet",
            "indexing_entity_manager": True,
            "indexing_plays": True,
            "latest_chain_block": 2,
            "latest_indexed_block": 1,
        },
    )

    # Cache core listens health data for the new logic
    cache_core_listens_health_vars(redis_mock, 2)

    # Set up db state
    with db_mock.scoped_session() as session:
        Block.__table__.create(db_mock._engine)
        session.add(
            Block(
                blockhash="0x01",
                number=1,
                parenthash="0x01",
                is_current=True,
            )
        )
        IndexingCheckpoint.__table__.create(db_mock._engine)

    args = {"verbose": True}
    health_results, _ = get_health(args)

    assert health_results["web"]["blocknumber"] == 2
    assert health_results["db"]["number"] == 1
    assert health_results["block_difference"] == 1

    assert health_results["db_connections"]["database_connections"] == 2
    assert health_results["db_connections"]["database_connection_info"] == [
        {
            "datname": "audius_discovery",
            "state": "idle",
            "query": "COMMIT",
            "wait_event_type": "Client",
            "wait_event": "ClientRead",
        }
    ]
    assert "country" in health_results
    assert "latitude" in health_results
    assert "longitude" in health_results
    assert "maximum_healthy_block_difference" in health_results
    assert "version" in health_results
    assert "service" in health_results


def test_get_health_challenge_events_max_drift(redis_mock, db_mock, mock_requests):
    """Tests that the health check honors an unhealthy challenge events drift"""

    cache_play_health_vars(redis_mock)
    cache_trusted_notifier_discrepancies_vars(redis_mock)

    # Set up redis state
    redis_mock.set(challenges_last_processed_event_redis_key, int(time() - 50))

    # Set up db state
    with db_mock.scoped_session() as session:
        Block.__table__.create(db_mock._engine)
        session.add(
            Block(
                blockhash="0x01",
                number=1,
                parenthash="0x01",
                is_current=True,
            )
        )

    args = {"challenge_events_age_max_drift": 49}
    health_results, error = get_health(args)

    assert error == True
    assert health_results["challenge_last_event_age_sec"] < int(time() - 49)


# re-enable when elastic search added back
# def test_get_elasticsearch_health(
#     web3_mock, redis_mock, db_mock, esclient_mock, mock_requests
# ):
#     # Set up web3 eth
#     def get_block(_u1, _u2):  # unused
#         block = MagicMock()
#         block.number = 2
#         block.hash = HexBytes(b"\x02")
#         return block

#     cache_play_health_vars(redis_mock)
#     cache_trusted_notifier_discrepancies_vars(redis_mock)
#     web3_mock.eth.get_block = get_block

#     # Set up db state
#     with db_mock.scoped_session() as session:
#         Block.__table__.create(db_mock._engine)
#         session.add(
#             Block(
#                 blockhash="0x01",
#                 number=1,
#                 parenthash="0x01",
#                 is_current=True,
#             )
#         )

#     def assert_typical_health_results(hrs):
#         assert hrs["web"]["blocknumber"] == 2
#         assert hrs["web"]["blockhash"] == "0x02"
#         assert hrs["db"]["number"] == 1
#         assert hrs["db"]["blockhash"] == "0x01"
#         assert hrs["block_difference"] == 1
#         assert hrs["plays"]["tx_info"]["slot_diff"] == 3
#         assert "maximum_healthy_block_difference" in hrs
#         assert "version" in hrs
#         assert "service" in hrs

#     def get_es_cluster_healthy():
#         return {"status": "green"}

#     def get_es_cluster_unhealthy():
#         return {"status": "red"}

#     def get_es_cluster_error():
#         raise Exception("Fake exception from mocked esclient")

#     esclient_mock.cluster.health = get_es_cluster_healthy
#     health_results, error = get_health({})
#     assert_typical_health_results(health_results)
#     assert health_results["elasticsearch"]["status"] == "green"
#     assert error == False

#     esclient_mock.cluster.health = get_es_cluster_unhealthy
#     health_results, error = get_health({})
#     assert_typical_health_results(health_results)
#     assert health_results["elasticsearch"]["status"] == "red"
#     assert error == True

#     esclient_mock.cluster.health = get_es_cluster_error
#     health_results, error = get_health({})
#     assert_typical_health_results(health_results)
#     assert health_results["elasticsearch"]["status"] != "green"
#     assert error == True
