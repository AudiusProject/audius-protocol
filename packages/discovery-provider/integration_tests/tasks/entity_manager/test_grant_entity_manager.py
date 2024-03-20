from typing import List

from web3 import Web3
from web3.datastructures import AttributeDict

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db, populate_mock_db_blocks
from src.models.grants.grant import Grant
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.utils import Action, EntityType
from src.utils.db_session import get_db

new_grants_data = [
    {
        "user_id": 1,
        "grantee_address": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4C4",
        "is_user_grant": False,
    },
    {
        "user_id": 1,
        "grantee_address": "0x04c9fc3784120f50932436f84c59aebebb12e0d",
        "is_user_grant": False,
    },
    {
        "user_id": 1,
        "grantee_address": "user3Wallet",
        "is_user_grant": True,
    },
]


def test_index_grant(app, mocker):
    "Tests grant create action"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, None)

    tx_receipts = {
        "CreateGrantTx1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.GRANT,
                        "_userId": new_grants_data[0]["user_id"],
                        "_metadata": f"""{{"grantee_address": "{new_grants_data[0]["grantee_address"]}"}}""",
                        "_action": Action.CREATE,
                        "_signer": f"user{new_grants_data[0]['user_id']}wallet",
                    }
                )
            },
        ],
        "CreateGrantTx2": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.GRANT,
                        "_userId": new_grants_data[1]["user_id"],
                        "_metadata": f"""{{"grantee_address": "{new_grants_data[1]["grantee_address"]}"}}""",
                        "_action": Action.CREATE,
                        "_signer": f"user{new_grants_data[1]['user_id']}wallet",
                    }
                )
            },
        ],
        "CreateGrantTx3": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.GRANT,
                        "_userId": new_grants_data[2]["user_id"],
                        "_metadata": f"""{{"grantee_address": "{new_grants_data[2]["grantee_address"]}"}}""",
                        "_action": Action.CREATE,
                        "_signer": f"user{new_grants_data[2]['user_id']}wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts[tx_receipt["transactionHash"].decode("utf-8")]

    mocker.patch(
        "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
        side_effect=get_events_side_effect,
        autospec=True,
    )

    entities = {
        "users": [
            {"user_id": user_id, "wallet": f"user{user_id}wallet"}
            for user_id in range(1, 6)
        ],
        "developer_apps": [
            {
                "user_id": 5,
                "name": "My App",
                "address": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4C4",
            },
            {
                "user_id": 4,
                "name": "My App",
                "address": "0x04c9fc3784120f50932436f84c59aebebb12e0d",
            },
        ],
        "grants": [
            {
                "user_id": 6,
                "grantee_address": "0x04c9fc3784120f50932436f84c59aebebb12e0d",
            }
        ],
    }
    populate_mock_db(db, entities)
    populate_mock_db_blocks(db, 5, 10)

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=5,
            block_timestamp=1000000000,
            block_hash=hex(0),
        )

        # validate db records
        all_grants: List[Grant] = session.query(Grant).all()
        assert len(all_grants) == 4

        for expected_grant in new_grants_data:
            found_matches = [
                item
                for item in all_grants
                if item.grantee_address == expected_grant["grantee_address"].lower()
                and item.user_id == expected_grant["user_id"]
            ]
            assert len(found_matches) == 1
            res = found_matches[0]
            assert res.is_current == True
            if expected_grant["is_user_grant"]:
                assert res.is_approved == None
            else:
                assert res.is_approved == True
            assert res.blocknumber == 5

    # Test invalid create grant txs
    tx_receipts = {
        "CreateGrantInvalidTx1": [
            {
                # Incorrect signer
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.GRANT,
                        "_userId": 1,
                        "_metadata": '{"grantee_address": "0x04c9fc3784120f50932436f84c59aebebb12e0d"}',
                        "_action": Action.CREATE,
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "CreateGrantInvalidTx2": [
            {
                # Duplicate address
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.GRANT,
                        "_userId": 1,
                        "_metadata": '{"grantee_address": "0x04c9fc3784120f50932436f84c59aebebb12e0d"}',
                        "_action": Action.CREATE,
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateGrantInvalidTx3": [
            {
                # App doesn't exist
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.GRANT,
                        "_userId": 2,
                        "_action": Action.CREATE,
                        "_metadata": '{"grantee_address": "0xB131910795586228F0D11c1560771aea9DB382C8"}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "CreateGrantInvalidTx4": [
            {
                # Missing metadata
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.GRANT,
                        "_userId": 2,
                        "_action": Action.CREATE,
                        "_metadata": '{"address": "0x1843CaAa96a173e8e31FD43503f44c33e4471385"}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    with db.scoped_session() as session:
        # index transactions
        timestamp = 1000000001
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=6,
            block_timestamp=timestamp,
            block_hash=hex(0),
        )
        # validate db records
        all_grants: List[Grant] = session.query(Grant).all()
        # make sure no new rows were added
        assert len(all_grants) == 4

    # Valid approve grant
    tx_receipts = {
        "ApproveGrantTx1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.GRANT,
                        "_userId": 3,
                        "_metadata": f"""{{"grantor_user_id": {new_grants_data[2]["user_id"]}}}""",
                        "_action": Action.APPROVE,
                        "_signer": "user3Wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    with db.scoped_session() as session:
        # index transactions
        timestamp = 1000000001
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=7,
            block_timestamp=timestamp,
            block_hash=hex(0),
        )
        # validate db records
        all_grants: List[Grant] = session.query(Grant).all()
        assert len(all_grants) == 4
        found_matches = [
            item
            for item in all_grants
            if item.grantee_address.lower() == "user3wallet" and item.user_id == 1
        ]
        assert len(found_matches) == 1
        assert found_matches[0].is_approved == True

    tx_receipts = {
        "InvalidDeleteGrantTx1": [
            {
                # Grant doesn't exist
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.GRANT,
                        "_userId": 1,
                        "_metadata": '{"grantee_address": "0xaB6Ac417265Ee2B8A1f1f4cccc7CeF5Be71584b9"}',
                        "_action": Action.DELETE,
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "InvalidDeleteGrantTx2": [
            {
                "args": AttributeDict(
                    {
                        # User id doesn't match grant
                        "_entityId": 0,
                        "_entityType": EntityType.GRANT,
                        "_userId": 3,
                        "_metadata": f"""{{"grantee_address": "{new_grants_data[0]["grantee_address"]}"}}""",
                        "_action": Action.DELETE,
                        "_signer": "user3wallet",
                    }
                )
            },
        ],
        "InvalidDeleteGrantTx3": [
            {
                "args": AttributeDict(
                    {
                        # Signer is incorrect
                        "_entityId": 0,
                        "_entityType": EntityType.GRANT,
                        "_userId": new_grants_data[0]["user_id"],
                        "_metadata": f"""{{"grantee_address": "{new_grants_data[0]["grantee_address"]}"}}""",
                        "_action": Action.DELETE,
                        "_signer": "badsigner",
                    }
                )
            },
        ],
    }

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    with db.scoped_session() as session:
        # index transactions
        timestamp = 1000000001
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=7,
            block_timestamp=timestamp,
            block_hash=hex(0),
        )
        # validate db records
        all_grants: List[Grant] = session.query(Grant).all()
        # make sure no new rows were added
        assert len(all_grants) == 4

    # Valid deletes
    tx_receipts = {
        "DeleteGrantTx1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.GRANT,
                        "_userId": new_grants_data[0]["user_id"],
                        "_metadata": f"""{{"grantee_address": "{new_grants_data[0]["grantee_address"]}"}}""",
                        "_action": Action.DELETE,
                        "_signer": f"user{new_grants_data[0]['user_id']}wallet",
                    }
                )
            },
        ],
        "DeleteGrantTx2": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.GRANT,
                        "_userId": new_grants_data[1]["user_id"],
                        "_metadata": f"""{{"grantee_address": "{new_grants_data[1]["grantee_address"]}"}}""",
                        "_action": Action.DELETE,
                        "_signer": f"user{new_grants_data[1]['user_id']}wallet",
                    }
                )
            },
        ],
        "DeleteGrantTx3": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.GRANT,
                        "_userId": new_grants_data[2]["user_id"],
                        "_metadata": f"""{{"grantee_address": "{new_grants_data[2]["grantee_address"]}"}}""",
                        "_action": Action.DELETE,
                        "_signer": f"user{new_grants_data[2]['user_id']}wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=8,
            block_timestamp=1000000000,
            block_hash=hex(0),
        )

        # validate db records
        all_grants: List[Grant] = session.query(Grant).all()
        assert len(all_grants) == 4

        for expected_grant in new_grants_data:
            found_matches = [
                item
                for item in all_grants
                if item.grantee_address == expected_grant["grantee_address"].lower()
                and item.is_current == True
                and item.user_id == expected_grant["user_id"]
            ]
            assert len(found_matches) == 1
            res = found_matches[0]
            assert res.user_id == expected_grant["user_id"]
            assert res.is_current == True
            assert res.grantee_address == expected_grant["grantee_address"].lower()
            assert res.is_revoked == True
            assert res.blocknumber == 8

    # Duplicate delete - should fail
    tx_receipts = {
        "DeleteGrantTx4": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.GRANT,
                        "_userId": new_grants_data[0]["user_id"],
                        "_metadata": f"""{{"grantee_address": "{new_grants_data[0]["grantee_address"]}"}}""",
                        "_action": Action.DELETE,
                        "_signer": f"user{new_grants_data[0]['user_id']}wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=9,
            block_timestamp=1000000000,
            block_hash=hex(0),
        )

        # validate db records
        all_grants: List[Grant] = session.query(Grant).all()
        # No change
        assert len(all_grants) == 4

    # Reactivate a revoked grant
    tx_receipts = {
        "CreateGrantTx4": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.GRANT,
                        "_userId": new_grants_data[1]["user_id"],
                        "_metadata": f"""{{"grantee_address": "{new_grants_data[1]["grantee_address"]}"}}""",
                        "_action": Action.CREATE,
                        "_signer": f"user{new_grants_data[1]['user_id']}wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=10,
            block_timestamp=1000000000,
            block_hash=hex(0),
        )

        # validate db records
        all_grants: List[Grant] = session.query(Grant).all()
        assert len(all_grants) == 4
        expected_grant = new_grants_data[1]
        found_matches = [
            item
            for item in all_grants
            if item.grantee_address == expected_grant["grantee_address"].lower()
            and item.user_id == expected_grant["user_id"]
            and item.is_current == True
        ]
        assert len(found_matches) == 1
        res = found_matches[0]
        assert res.user_id == expected_grant["user_id"]
        assert res.is_current == True
        assert res.grantee_address == expected_grant["grantee_address"].lower()
        assert res.is_revoked == False
        assert res.blocknumber == 10
