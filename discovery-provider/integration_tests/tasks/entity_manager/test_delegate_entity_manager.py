from typing import List

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.models.delegates.delegate import Delegate
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.utils import Action, EntityType
from src.utils.db_session import get_db
from web3 import Web3
from web3.datastructures import AttributeDict

new_delegates_data = [
    {
        "user_id": 1,
        "name": "My App",
        "address": "0x04c9fc3784120f50932436f84c59aebebb12e0d",
        "is_personal_access": False,
    },
    {
        "user_id": 1,
        "name": "My Other App",
        "address": "0x7Be50316dCD27a224E82F80bB154C1ea70D57f19",
        "is_personal_access": True,
    },
    {
        "user_id": 2,
        "name": "User 2 App",
        "address": "0x1A3a04F77Eca3BBae35d79FC4B48a783D382AC63",
        "is_personal_access": False,
    },
]


def test_index_delegate(app, mocker):
    "Tests delegate create action"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(None, web3, None)

    """"
    const resp = await this.manageEntity({
        userId,
        entityType: EntityType.DELEGATE,
        entityId: 0,
        action: Action.CREATE,
        metadataMultihash: ''
      })
    """
    tx_receipts = {
        "CreateDelegateTx1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DELEGATE,
                        "_userId": new_delegates_data[0]["user_id"],
                        "_metadata": f"""{{"name": "{new_delegates_data[0]["name"]}", "address": "{new_delegates_data[0]["address"]}", "is_personal_access": {'true' if new_delegates_data[0]["is_personal_access"] else 'false' }}}""",
                        "_action": Action.CREATE,
                        "_signer": "0x04c9fc3784120f50932436f84c59aebebb12e0d",
                    }
                )
            },
        ],
        "CreateDelegateTx2": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DELEGATE,
                        "_userId": new_delegates_data[1]["user_id"],
                        "_action": Action.CREATE,
                        "_metadata": f"""{{"name": "{new_delegates_data[1]["name"]}", "address": "{new_delegates_data[1]["address"]}", "is_personal_access": {'true' if new_delegates_data[1]["is_personal_access"] else 'false' }}}""",
                        "_signer": "0x7Be50316dCD27a224E82F80bB154C1ea70D57f19",
                    }
                )
            },
        ],
        "CreateDelegateTx3": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DELEGATE,
                        "_userId": new_delegates_data[2]["user_id"],
                        "_action": Action.CREATE,
                        "_metadata": f"""{{"name": "{new_delegates_data[2]["name"]}", "address": "{new_delegates_data[2]["address"]}", "is_personal_access": {'true' if new_delegates_data[2]["is_personal_access"] else 'false' }}}""",
                        "_signer": "0x1A3a04F77Eca3BBae35d79FC4B48a783D382AC63",
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
            for user_id in range(1, 4)
        ],
        "delegates": [
            {
                "user_id": 5,
                "name": "My App",
                "address": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4C4",
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
        all_delegates: List[Delegate] = session.query(Delegate).all()
        assert len(all_delegates) == 4

        for expected_delegate in new_delegates_data:
            found_matches = [
                item
                for item in all_delegates
                if item.address == expected_delegate["address"].lower()
            ]
            assert len(found_matches) == 1
            res = found_matches[0]
            assert res.user_id == expected_delegate["user_id"]
            assert res.name == expected_delegate["name"]
            assert res.is_personal_access == expected_delegate["is_personal_access"]
            assert res.blocknumber == 0

    # Test invalid create delegate txs
    tx_receipts = {
        "CreateDelegateInvalidTx1": [
            {
                # Incorrect signer
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DELEGATE,
                        "_userId": 4,
                        "_action": Action.CREATE,
                        "_metadata": '{"name": "Wrong Signer", "address": "0x4D66645bC8Ac35c02a23bac8D795F9C9Fe765055", "is_personal_access": false}',
                        "_signer": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4C4",
                    }
                )
            },
        ],
        "CreateDelegateInvalidTx2": [
            {
                # Duplicate address
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DELEGATE,
                        "_userId": 2,
                        "_action": Action.CREATE,
                        "_metadata": '{"name": "Dupe address", "address": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4C4", "is_personal_access": false}',
                        "_signer": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4C4",
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
        all_delegates: List[Delegate] = session.query(Delegate).all()
        # make sure no new rows were added
        assert len(all_delegates) == 4
