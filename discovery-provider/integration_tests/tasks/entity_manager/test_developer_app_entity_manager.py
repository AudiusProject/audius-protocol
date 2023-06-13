from typing import List

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.models.grants.developer_app import DeveloperApp
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.utils import Action, EntityType
from src.utils.db_session import get_db
from web3 import Web3
from web3.datastructures import AttributeDict

new_apps_data = [
    {
        "user_id": 1,
        "name": "My App",
        "description": "My app description",
        "address": "0x04c9fc3784120f50932436f84c59aebebb12e0d",
        "is_personal_access": False,
    },
    {
        "user_id": 1,
        "name": "My Other App",
        "description": "",
        "address": "0x7Be50316dCD27a224E82F80bB154C1ea70D57f19",
        "is_personal_access": True,
    },
    {
        "user_id": 2,
        "name": "User 2 App",
        "address": "0x1A3a04F77Eca3BBae35d79FC4B48a783D382AC63",
    },
]


def test_index_app(app, mocker):
    "Tests app action"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, None)

    """"
    const resp = await this.manageEntity({
        userId,
        entityType: EntityType.DEVELOPER_APP,
        entityId: 0,
        action: Action.CREATE,
        metadataMultihash: ''
      })
    """
    tx_receipts = {
        "CreateAppTx1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": new_apps_data[0]["user_id"],
                        "_metadata": f"""{{"name": "{new_apps_data[0]["name"]}", "description": "{new_apps_data[0]["description"]}", "address": "{new_apps_data[0]["address"]}", "is_personal_access": {'true' if new_apps_data[0]["is_personal_access"] else 'false' }}}""",
                        "_action": Action.CREATE,
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateAppTx2": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": new_apps_data[1]["user_id"],
                        "_action": Action.CREATE,
                        "_metadata": f"""{{"name": "{new_apps_data[1]["name"]}", "description": "{new_apps_data[1]["description"]}", "address": "{new_apps_data[1]["address"]}", "is_personal_access": {'true' if new_apps_data[1]["is_personal_access"] else 'false' }}}""",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateAppTx3": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": new_apps_data[2]["user_id"],
                        "_action": Action.CREATE,
                        "_metadata": f"""{{"name": "{new_apps_data[2]["name"]}", "address": "{new_apps_data[2]["address"]}"}}""",
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
        "developer_apps": [
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
        )

        # validate db records
        all_apps: List[DeveloperApp] = session.query(DeveloperApp).all()
        assert len(all_apps) == 4

        for expected_app in new_apps_data:
            found_matches = [
                item
                for item in all_apps
                if item.address == expected_app["address"].lower()
            ]
            assert len(found_matches) == 1
            res = found_matches[0]
            assert res.user_id == expected_app["user_id"]
            assert res.name == expected_app["name"]
            assert res.description == (
                expected_app.get("description", None) or None
            )  # If description value is empty in metadata, the description value should be null in the table row.
            assert res.is_personal_access == expected_app.get(
                "is_personal_access", False
            )
            assert res.blocknumber == 0

    # Test invalid create app txs
    tx_receipts = {
        "CreateAppInvalidTx1": [
            {
                # Incorrect signer
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": 4,
                        "_action": Action.CREATE,
                        "_metadata": '{"name": "Wrong Signer", "address": "0x4D66645bC8Ac35c02a23bac8D795F9C9Fe765055", "is_personal_access": false}',
                        "_signer": "0x4D66645bC8Ac35c02a23bac8D795F9C9Fe765055",
                    }
                )
            },
        ],
        "CreateAppInvalidTx2": [
            {
                # Duplicate address
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": 2,
                        "_action": Action.CREATE,
                        "_metadata": '{"name": "Dupe address", "address": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4C4", "is_personal_access": false}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "CreateAppInvalidTx3": [
            {
                # Missing user id
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": 0,
                        "_action": Action.CREATE,
                        "_metadata": '{"name": "Missing user id", "address": "0x096F230cf5b3dF9cf90a8629689268f6564B29B5", "is_personal_access": false}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "CreateAppInvalidTx4": [
            {
                # Missing name
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": 2,
                        "_action": Action.CREATE,
                        "_metadata": '{"address": "0x096F230cf5b3dF9cf90a8629689268f6564B29B5"}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "CreateAppInvalidTx5": [
            {
                # Description is too long
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": 2,
                        "_action": Action.CREATE,
                        "_metadata": '{"address": "0x096F230cf5b3dF9cf90a8629689268f6564B29B5", "name": "My app", "description": "The picket fence had stood for years without any issue. That was all it was. A simple, white, picket fence. Why it had all of a sudden become a lightning rod within the community was still unbelievable to most."}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "CreateAppInvalidTx6": [
            {
                # Description is not right type
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": 2,
                        "_action": Action.CREATE,
                        "_metadata": '{"address": "0x096F230cf5b3dF9cf90a8629689268f6564B29B5", "name": "My app", "description": false}',
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
            block_number=1,
            block_timestamp=timestamp,
            block_hash=0,
        )
        # validate db records
        all_apps: List[DeveloperApp] = session.query(DeveloperApp).all()
        # make sure no new rows were added
        assert len(all_apps) == 4

    # Test invalid delete app txs
    tx_receipts = {
        "DeleteAppInvalidTx1": [
            {
                # Incorrect signer
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_action": Action.DELETE,
                        "_userId": new_apps_data[0]["user_id"],
                        "_metadata": f"""{{"address": "{new_apps_data[0]["address"]}"}}""",
                        "_signer": "incorrectwallet",
                    }
                )
            },
        ],
        "DeleteAppInvalidTx2": [
            {
                # App doesn't exist
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": 2,
                        "_action": Action.DELETE,
                        "_metadata": '{"address": "0x3a388671bb4D6E1bbbbD79Ee191b40FB45A8F4C4"}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "DeleteAppInvalidTx3": [
            {
                # User id doesn't match app
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": 1,
                        "_action": Action.DELETE,
                        "_metadata": f"""{{"address": "{new_apps_data[2]["address"]}"}}""",
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
        )
        # validate db records
        all_apps: List[DeveloperApp] = session.query(DeveloperApp).all()
        # make sure no new rows were added
        assert len(all_apps) == 4

    # Test valid delete app txs
    tx_receipts = {
        "DeleteAppTx1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_action": Action.DELETE,
                        "_userId": new_apps_data[0]["user_id"],
                        "_metadata": f"""{{"address": "{new_apps_data[0]["address"]}"}}""",
                        "_signer": f"user{new_apps_data[0]['user_id']}wallet",
                    }
                )
            },
        ],
        "DeleteAppTx2": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_action": Action.DELETE,
                        "_userId": new_apps_data[1]["user_id"],
                        "_metadata": f"""{{"address": "{new_apps_data[1]["address"]}"}}""",
                        "_signer": f"user{new_apps_data[1]['user_id']}wallet",
                    }
                )
            },
        ],
        "DeleteAppTx3": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_action": Action.DELETE,
                        "_userId": new_apps_data[2]["user_id"],
                        "_metadata": f"""{{"address": "{new_apps_data[2]["address"]}"}}""",
                        "_signer": f"user{new_apps_data[2]['user_id']}wallet",
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
            block_number=1,
            block_timestamp=timestamp,
            block_hash=0,
        )
        # validate db records
        all_apps: List[DeveloperApp] = session.query(DeveloperApp).all()
        assert len(all_apps) == 7

        for expected_app in new_apps_data:
            found_matches = [
                item
                for item in all_apps
                if item.address == expected_app["address"].lower()
            ]
            assert len(found_matches) == 2
            old = [item for item in found_matches if item.is_current == False]
            assert len(old) == 1
            updated = [item for item in found_matches if item.is_current == True]
            assert len(updated) == 1
            old = old[0]
            updated = updated[0]
            assert (
                old.user_id == expected_app["user_id"]
                and updated.user_id == expected_app["user_id"]
            )
            assert (
                old.name == expected_app["name"]
                and updated.name == expected_app["name"]
            )
            assert old.description == (
                expected_app.get("description", None) or None
            ) and updated.description == (expected_app.get("description", None) or None)
            assert old.is_personal_access == expected_app.get(
                "is_personal_access", False
            ) and updated.is_personal_access == expected_app.get(
                "is_personal_access", False
            )
            assert old.is_delete == False and updated.is_delete == True
            assert old.blocknumber == 0 and updated.blocknumber == 1
