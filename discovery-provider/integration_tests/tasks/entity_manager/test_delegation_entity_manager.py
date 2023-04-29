from typing import List

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.models.delegates.delegation import Delegation
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.utils import Action, EntityType
from src.utils.db_session import get_db
from web3 import Web3
from web3.datastructures import AttributeDict

new_delegations_data = [
    {
        "user_id": 1,
        "shared_address": "0xDEA175F7C4c773DC54FC7C132eA85805936069BF",
        "delegate_address": "user3wallet",
        "is_user_delegation": True,
    },
    {
        "user_id": 1,
        "shared_address": "0x2aa4998ddf6A2C365323021061E0AE0F18F5a1DC",
        "delegate_address": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4C4",
        "is_user_delegation": False,
    },
    {
        "user_id": 1,
        "shared_address": "0xaCa953E9197B79ca297A51315eA7FB467e062757",
        "delegate_address": "0x04c9fc3784120f50932436f84c59aebebb12e0d",
        "is_user_delegation": False,
    },
]


def test_index_delegation(app, mocker):
    "Tests delegation create action"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(None, web3, None)

    """"
    const resp = await this.manageEntity({
        userId,
        entityType: EntityType.DELEGATION,
        entityId: 0,
        action: Action.CREATE,
        metadataMultihash: ''
      })
    """
    tx_receipts = {
        "CreateDelegationTx1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DELEGATION,
                        "_userId": new_delegations_data[0]["user_id"],
                        "_metadata": f"""{{"shared_address": "{new_delegations_data[0]["shared_address"]}", "delegate_address": "{new_delegations_data[0]["delegate_address"]}"}}""",
                        "_action": Action.CREATE,
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateDelegateTx2": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DELEGATION,
                        "_userId": new_delegations_data[1]["user_id"],
                        "_metadata": f"""{{"shared_address": "{new_delegations_data[1]["shared_address"]}", "delegate_address": "{new_delegations_data[1]["delegate_address"]}"}}""",
                        "_action": Action.CREATE,
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateDelegateTx3": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DELEGATION,
                        "_userId": new_delegations_data[2]["user_id"],
                        "_metadata": f"""{{"shared_address": "{new_delegations_data[2]["shared_address"]}", "delegate_address": "{new_delegations_data[2]["delegate_address"]}"}}""",
                        "_action": Action.CREATE,
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.toBytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts[tx_receipt.transactionHash.decode("utf-8")]

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
        "app_delegates": [
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
        "delegations": [
            {
                "user_id": 1,
                "shared_address": "0xdB384D555480214632D08609848BbFB54CCeb76c",
                "delegate_address": "0x04c9fc3784120f50932436f84c59aebebb12e0d",
            }
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            None,
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1000000000,
            block_hash=0,
            metadata={},
        )

        # validate db records
        all_delegations: List[Delegation] = session.query(Delegation).all()
        assert len(all_delegations) == 4

        for expected_delegation in new_delegations_data:
            found_matches = [
                item
                for item in all_delegations
                if item.shared_address == expected_delegation["shared_address"].lower()
            ]
            assert len(found_matches) == 1
            res = found_matches[0]
            assert res.user_id == expected_delegation["user_id"]
            assert res.shared_address == expected_delegation["shared_address"].lower()
            assert (
                res.delegate_address == expected_delegation["delegate_address"].lower()
            )
            if expected_delegation["is_user_delegation"]:
                assert res.is_approved == False
            else:
                assert res.is_approved == True
            assert res.blocknumber == 0

    # Test invalid create delegation txs
    tx_receipts = {
        "CreateDelegationInvalidTx1": [
            {
                # Incorrect signer
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DELEGATION,
                        "_userId": 1,
                        "_metadata": '{"shared_address": "0x7899C15374cD5E332656BDDc6801c16af76a584B", "delegate_address": "0x04c9fc3784120f50932436f84c59aebebb12e0d"}',
                        "_action": Action.CREATE,
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "CreateDelegationInvalidTx2": [
            {
                # Duplicate address
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DELEGATION,
                        "_userId": 1,
                        "_metadata": '{"shared_address": "0xdB384D555480214632D08609848BbFB54CCeb76c", "delegate_address": "0x04c9fc3784120f50932436f84c59aebebb12e0d"}',
                        "_action": Action.CREATE,
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateDelegationInvalidTx3": [
            {
                # Delegate doesn't exist
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DELEGATION,
                        "_userId": 2,
                        "_action": Action.CREATE,
                        "_metadata": '{"shared_address": "0xaB6Ac417265Ee2B8A1f1f460987CeF5Be71584b9", "delegate_address": "0xB131910795586228F0D11c1560771aea9DB382C8"}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "CreateDelegationInvalidTx4": [
            {
                # Missing metadata
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DELEGATION,
                        "_userId": 2,
                        "_action": Action.CREATE,
                        "_metadata": '{"shared_address": "0x1843CaAa96a173e8e31FD43503f44c33e4471385"}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.toBytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    with db.scoped_session() as session:
        # index transactions
        timestamp = 1000000001
        entity_manager_update(
            None,
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=timestamp,
            block_hash=0,
            metadata={},
        )
        # validate db records
        all_delegations: List[Delegation] = session.query(Delegation).all()
        # make sure no new rows were added
        assert len(all_delegations) == 4
