import asyncio
from unittest.mock import create_autospec

from construct import ListContainer
from src.models.models import AudiusDataTx
from src.solana.anchor_program_indexer import AnchorProgramIndexer
from src.solana.solana_client_manager import SolanaClientManager
from src.utils.cid_metadata_client import CIDMetadataClient
from src.utils.config import shared_config
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis
from web3 import Web3

PROGRAM_ID = shared_config["solana"]["anchor_data_program_id"]
ADMIN_STORAGE_PUBLIC_KEY = shared_config["solana"]["anchor_admin_storage_public_key"]

LABEL = "test_indexer"


def test_exists_in_db_and_get_latest_slot(app):  # pylint: disable=W0621
    with app.app_context():
        db = get_db()
        redis = get_redis()

    solana_client_manager_mock = create_autospec(SolanaClientManager)
    cid_metadata_client_mock = create_autospec(CIDMetadataClient)
    anchor_program_indexer = AnchorProgramIndexer(
        PROGRAM_ID,
        ADMIN_STORAGE_PUBLIC_KEY,
        LABEL,
        redis,
        db,
        solana_client_manager_mock,
        cid_metadata_client_mock,
    )

    TEST_TX_HASH = "3EvzmLSZekcQn3zEGFUkaoXej9nUrwkomyTpu9PRBaJJDAtzFQ3woYuGmnLHrqY6kZJtxamqCgeu17euyGp3EN4W"
    TEST_TX_SLOT = 100

    with db.scoped_session() as session:
        assert anchor_program_indexer.is_tx_in_db(session, TEST_TX_HASH) == False
        session.add(AudiusDataTx(signature=TEST_TX_HASH, slot=TEST_TX_SLOT))
        assert anchor_program_indexer.is_tx_in_db(session, TEST_TX_HASH) == True

    latest_slot = anchor_program_indexer.get_latest_slot()
    assert latest_slot == TEST_TX_SLOT


def test_validate_and_save_parsed_tx_records(app):
    with app.app_context():
        db = get_db()
        redis = get_redis()

    solana_client_manager_mock = create_autospec(SolanaClientManager)
    cid_metadata_client_mock = create_autospec(CIDMetadataClient)

    anchor_program_indexer = AnchorProgramIndexer(
        PROGRAM_ID,
        ADMIN_STORAGE_PUBLIC_KEY,
        LABEL,
        redis,
        db,
        solana_client_manager_mock,
        cid_metadata_client_mock,
    )
    processed_transactions = [
        {"tx_sig": "test_sig1", "result": {"slot": 1}},
        {"tx_sig": "test_sig2", "result": {"slot": 2}},
    ]
    anchor_program_indexer.validate_and_save_parsed_tx_records(
        processed_transactions, {}
    )
    with db.scoped_session() as session:
        for tx_entry in processed_transactions:
            assert (
                anchor_program_indexer.is_tx_in_db(session, tx_entry["tx_sig"]) == True
            )


def test_parse_tx(app):
    with app.app_context():
        db = get_db()
        redis = get_redis()

    solana_client_manager_mock = create_autospec(SolanaClientManager)
    cid_metadata_client_mock = create_autospec(CIDMetadataClient)

    solana_client_manager_mock.get_sol_tx_info.return_value = mock_tx_info
    anchor_program_indexer = AnchorProgramIndexer(
        PROGRAM_ID,
        ADMIN_STORAGE_PUBLIC_KEY,
        LABEL,
        redis,
        db,
        solana_client_manager_mock,
        cid_metadata_client_mock,
    )
    resp = asyncio.run(
        anchor_program_indexer.parse_tx(
            "5vvRr1R99NoU53vuZgukBkyNtfzojGT93ryCJkf6Xv6Yjb1xgb9gfkPLiddgVrhPZ44Jx5SxX4SaB4ZtJaiLMuzW"
        )
    )
    assert resp["tx_metadata"]["instructions"] is not None
    assert len(resp["tx_metadata"]["instructions"]) == 1
    instr = resp["tx_metadata"]["instructions"][0]
    assert instr["instruction_name"] == "create_content_node"
    assert instr["data"] is not None
    data = instr["data"]
    sp_id = data.get("sp_id")
    base = data.get("base")
    authority = data.get("authority")
    owner_eth_address: ListContainer = data.get("owner_eth_address")
    owner_eth_address_array = list(owner_eth_address)
    owner_eth_address_hex = Web3.toChecksumAddress(
        f"0x{bytes(owner_eth_address_array).hex()}"
    )
    assert sp_id == 1
    assert str(base) == "DUvTEvu2WHLWstwgn38S5fCpE23L8yd36WDKxYoAHHax"
    assert str(authority) == "HEpbkzohyMFbc2cQ4KPRbXRUVbgFW3uVrHaKPdMD6pqJ"
    assert owner_eth_address_hex == "0x25A3Acd4758Ab107ea0Bd739382B8130cD1F204d"


def test_fetch_metadata(app):
    with app.app_context():
        db = get_db()
        redis = get_redis()

    solana_client_manager_mock = create_autospec(SolanaClientManager)
    cid_metadata_client_mock = create_autospec(CIDMetadataClient)
    cid_metadata_client_mock.fetch_metadata_from_gateway_endpoints.return_value = (
        mock_cid_metadata
    )
    solana_client_manager_mock.get_sol_tx_info.return_value = mock_init_user_tx_info
    anchor_program_indexer = AnchorProgramIndexer(
        PROGRAM_ID,
        ADMIN_STORAGE_PUBLIC_KEY,
        LABEL,
        redis,
        db,
        solana_client_manager_mock,
        cid_metadata_client_mock,
    )
    parsed_tx = asyncio.run(
        anchor_program_indexer.parse_tx(
            "x4PCuQs3ncvhJ3Qz18CBzYg26KnG1tAD1QvZG9B6oBZbR8cJrat2MzcvCbjtMMn9Mkc4C8w23LHTFaLG4dJaXkV"
        )
    )
    parsed_transactions = [{parsed_tx}]
    cid_metadata = asyncio.run(
        anchor_program_indexer.fetch_ipfs_metadata(parsed_transactions)
    )
    assert cid_metadata == mock_cid_metadata


"""

Base64 Encoded transaction for create_content_node
Generated by running locally and initializing through CLI
TX_HASH = 5vvRr1R99NoU53vuZgukBkyNtfzojGT93ryCJkf6Xv6Yjb1xgb9gfkPLiddgVrhPZ44Jx5SxX4SaB4ZtJaiLMuzW

CLI OUTPUT:

Using programID=5YQDSSvmhtbbZ5bec11ofZAe4U65866fvLjo5CMnTtvb
Initializing content node
Using spID=1 ethAddress=0x25A3Acd4758Ab107ea0Bd739382B8130cD1F204d, delegateOwnerWallet (aka authority) = HEpbkzohyMFbc2cQ4KPRbXRUVbgFW3uVrHaKPdMD6pqJ, secret=[26,50,16,83,35,208,77,112,240,108,5,102,46,21,207,184,106,186,131,110,242,20,52,20,36,188,123,145,188,124,21,119,241,69,92,173,144,138,61,34,250,115,74,110,187,241,40,60,131,51,151,15,181,47,146,198,236,139,122,209,198,76,224,149]
Initialized with 5vvRr1R99NoU53vuZgukBkyNtfzojGT93ryCJkf6Xv6Yjb1xgb9gfkPLiddgVrhPZ44Jx5SxX4SaB4ZtJaiLMuzW
"""
mock_tx_info = {
    "jsonrpc": "2.0",
    "result": {
        "blockTime": 1649213307,
        "meta": {
            "err": None,
            "fee": 10000,
            "innerInstructions": [
                {
                    "index": 0,
                    "instructions": [
                        {
                            "accounts": [0, 2],
                            "data": "11113PDh3ViVZKYddDXcAcWezcDhHo9G8k3u7f5TjhWsougwMQouHik4aEGyKYuSo13a7Z",
                            "programIdIndex": 3,
                        }
                    ],
                }
            ],
            "logMessages": [
                "Program 5YQDSSvmhtbbZ5bec11ofZAe4U65866fvLjo5CMnTtvb invoke [1]",
                "Program log: Instruction: CreateContentNode",
                "Program 11111111111111111111111111111111 invoke [2]",
                "Program 11111111111111111111111111111111 success",
                "Program 5YQDSSvmhtbbZ5bec11ofZAe4U65866fvLjo5CMnTtvb consumed 20537 of 200000 compute units",
                "Program 5YQDSSvmhtbbZ5bec11ofZAe4U65866fvLjo5CMnTtvb success",
            ],
            "postBalances": [99997232560, 0, 1308480, 1, 1398960, 1141440],
            "postTokenBalances": [],
            "preBalances": [99998551040, 0, 0, 1, 1398960, 1141440],
            "preTokenBalances": [],
            "rewards": [],
            "status": {"Ok": None},
        },
        "slot": 9938,
        "transaction": [
            "AvaRTFi7WVxzIijBEVc4B5Ps8ll3ozhMSHdF7al+v7b5Z4r3Bu61R8DDjzAod/FrC22lZnBEin+7+7tlHymhMgfIrRCD3uxdGP6R+A84FP+TMA7EEVIlmGYcCvbRDnDxyYROJLJSaNJWGL+J5FIufOfJfPNb4i1hXgpKyQLpcYUMAgEDBhMYR0gaJdLc/CI154pUmHX3gqnKFwoy/4olw3nvTFaUgM1vIl0AoxuqkjFUBVCbDg8jeoikqIU9Ts5JLq//ULFCrDv/rKR8jrgu/f7GZjQmuyj1Mc4gPBBCQanEmRZKGwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG0E8qifsSdRGe3BWTqLpTygo/xPVsaNdICG+eY9E7SlDegBfyJ5l5o1xF2pt505LZZKxGYqNZuhDnIoDDCWjcAP8j8iVuHOPY5bweYUjVm1XnBPhrWVInXiRwl/ouFnjAQUFBAIBAANeNHxRaLAlHaS5c10iFWeNdLEjhjBMTreKg7tUx91/bPH5WR5Kg/r+AQEA8UVcrZCKPSL6c0puu/EoPIMzlw+1L5LG7It60cZM4JUlo6zUdYqxB+oL1zk4K4EwzR8gTQ==",
            "base64",
        ],
    },
    "id": 1,
}

"""
init_user

Transaction hash: 49JukZRppwZoKPJdmVbYx7LzLBrYWk4WtE1tNy1gT6MZ6mgBeLMSnPzWQoshMqw4StnhX9oLimftz6oAnxgkdVmw
"""
mock_init_user_tx_info = {
    "jsonrpc": "2.0",
    "result": {
        "blockTime": 1647654197,
        "meta": {
            "err": None,
            "fee": 10000,
            "innerInstructions": [
                {
                    "index": 0,
                    "instructions": [
                        {
                            "accounts": [0, 2],
                            "data": "11114YXfGxkrVTyKRDJVxTUsxshYiLDV9gbUjmj9LPu5KC9LFHhBAMiMrhuqZopQBVdrvb",
                            "programIdIndex": 3,
                        }
                    ],
                }
            ],
            "logMessages": [
                "Program FTGuS5uffmTm6tyqt5ZXpotvx3przDrjXWebpJjcDiPR invoke [1]",
                "Program log: Instruction: InitUser",
                "Program 11111111111111111111111111111111 invoke [2]",
                "Program 11111111111111111111111111111111 success",
                "Program FTGuS5uffmTm6tyqt5ZXpotvx3przDrjXWebpJjcDiPR consumed 36389 of 200000 compute units",
                "Program FTGuS5uffmTm6tyqt5ZXpotvx3przDrjXWebpJjcDiPR success",
            ],
            "postBalances": [
                499999983752906760,
                0,
                1350240,
                1,
                1308480,
                1308480,
                1398960,
                1308480,
                1141440,
            ],
            "postTokenBalances": [],
            "preBalances": [
                499999983754267000,
                0,
                0,
                1,
                1308480,
                1308480,
                1398960,
                1308480,
                1141440,
            ],
            "preTokenBalances": [],
            "rewards": [],
            "status": {"Ok": None},
        },
        "slot": 40982,
        "transaction": [
            "Ap03V0cVVm6r878HWBH6H+Arh0WPGX7pVOsrBQxfTEzUOzqygRnOB6tq8LtYBHqNN8A/Sw8pvt2EM5pgL8wtNg4KgjY2elfGAs2GgUW1nTGxHxuiu9FKpiTNbE7Rnu0UiQtGcvGmKbHB0S4Vmv7MmsB/KbY3hp0175fXDVm97twGAgAGCZtj1J/VlcaC7M8Ef61LU2v4aBtsmBsfhdAKRS35T8/UD+2NQ3oVhAnDMa5xZdRO1PSRknN+KZzCpeTNa0brf9Fp98juYTteVpICugplx7NrFLMpEHNkTl2GBEkVnPzC4gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv44VsY0loYMws5o4nsQ+YepLJPTbyhZw/VUzpqDmCNObf9d5N3ZI5ng18WpQZM2yjMBpStC6dNLe+apOWoKCKadzZJf3qt+itMewY/0Zjxu3Ja/HLjM1hiYAufGICkGtBuTjtRVBRW5T9ctbXrTA5noj3h7AC9XyWhwVb/XEHbWvrNisIwb4xE5XvvrWvpeQc3ucMHITXy1dQFtWzQu6O2lUxOvqcxw0sh/d6AUlKuYHC6EYOofsIrUtW/Z2BPYAQgIBgIHBAUBAAOYAQ4zRJ/tTp5mJWak54ES3z9N2obW5GyS65PZExEXRLcRWGuadSx/2LYKk9jLC+hbPqjzP6Y1ANEY3ryD9wEAAgADAP7+/2hhbmRsZWJjZGVmAAAAAAAAAAAAAAAAAAAAAAAAAAAA/i4AAABRbXlFSEhXWGJFUzFuT1VCSU04OWVZZnNtTTI1cjNDdzdpQnBGWnlaOWxiZlJT",
            "base64",
        ],
    },
    "id": 1,
}

mock_cid_metadata = {"QmyEHHWXbES1nOUBIM89eYfsmM25r3Cw7iBpFZyZ9lbfRS": "test"}
