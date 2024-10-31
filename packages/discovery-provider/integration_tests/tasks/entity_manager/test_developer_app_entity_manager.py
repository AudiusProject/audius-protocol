from typing import List

from freezegun import freeze_time
from web3 import Web3
from web3.datastructures import AttributeDict
from web3.types import TxReceipt

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.models.grants.developer_app import DeveloperApp
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.utils import Action, EntityType
from src.utils.db_session import get_db

first_set_new_apps_data = [
    {
        "user_id": 1,
        "name": "My App",
        "description": "My app description",
        "address": "0xec923d132cda1e003b237c968422349854f14e25",
        "app_signature": {
            "signature": "6c54d37aabd7788727de21b556e54536311e1f00eff6a12a355bf6f1a80afc1f53b75f88f098e60e3d8f76e68a17071126ea66a1ae18d8193e8b7cc367f6121d1b",
            "message": "Creating Audius developer app at 1686252026",
        },
        "is_personal_access": False,
    },
    {
        "user_id": 1,
        "name": "My Other App",
        "description": "",
        "image_url": "https://avatars.githubusercontent.com/u/38231615",
        "address": "0x52007fcc1ef9e436be0b0aa8201d1f28b7303b13",
        "app_signature": {
            "signature": "314ff529493c4b85d3a863c9836d2f6e1fccf26692f9c7fbcb6df992aa96610761ab621f89dfdcf3251178b683f3456dc60091e0192ef47912a7a224b609eda01b",
            "message": "Creating Audius developer app at 1686252026",
        },
        "is_personal_access": True,
    },
    {
        "user_id": 2,
        "name": "User 2 App",
        "image_url": "i am not a url lol!",
        "address": "0x1f590ded56a693ee4dd986d820236f82d3659b96",
        "app_signature": {
            "signature": "47944289d41c8c4051987a69cda73f3099064b0a5b2e32e03b620911ead1a37e59daaa5c0323ddc42c9da0c34c1c842a2c302e1e27dae971118e57de255e7db51b",
            "message": "Creating Audius developer app at 1686252026",
        },
    },
    {
        "user_id": 1,
        "name": "My App Again",
        "description": "",
        "address": "0xdac2e78877758996781e9a30b7c5ca4e717d2665",
        "app_signature": {
            "signature": "07e1d2604a0b9e0c0a47e9c4d398874536921757e74d6ea1ffa1a53d3cf604da0b8ff60ced5b2312ecdb30ba4bc5a105bdde02093a9725c3dd2bfb86b964c4211b",
            "message": "Creating Audius developer app at 1686252024",
        },
    },
    {
        "user_id": 1,
        "name": "My Fourth App",
        "description": "Fantastic",
        "address": "0x94c2f1b214b5c3d2d2e5f5bb9ad4f5a4b6a07bbf",
        "app_signature": {
            "signature": "f9d2b5c7e1a4b6c3d8f0e3a7b9d4c1f5e3988745368a3b6d2f9c5b8a4e7d1c3a8b5f0d6e9c7b1d3f4e0a5c8b2d9e3f7c6a1b9d4f2c0e5a7b3f8c6d1b0a9e4c5f37",
            "message": "Creating Audius developer app at 1686285024",
        },
    },
    {
        "user_id": 1,
        "name": "My Fifth Again",
        "description": "Mambo",
        "address": "0xd4f8e1b5a7c3e6f9c2d5a4b3e1f6b7d8a9c5b2f1",
        "app_signature": {
            "signature": "a7d4e9b2f6c3a1b5d8e0f3c40e5a7b3f8cb9a2d7e5c1f8b3d6a9e4c2f5b1d7e0a6c9f4e3b8d2a1f5c0b6d8e7a3b9c1f2d5a0e4c8b7d9f3a1b4e6c2f8d7b0a5e3c6",
            "message": "Creating Audius developer app at 1687285024",
        },
    },
]

second_set_new_apps_data = [
    {
        "user_id": 1,
        "name": "My New App",
        "description": "My app description",
        "address": "0x00ac9540c24b59ca8a6253397420c9a73c4ab3a7",
        "app_signature": {
            "signature": "efa178e0979f09e536dbf8e7815163411d0b3f3261beed24f73882ffa9db8e8d566595b47ced52fb57b4fbf2de8209d6f38c50a43659a5349c164dcb7ebf33001b",
            "message": "Creating Audius developer app at 1686252026",
        },
    },
]


@freeze_time("2023-06-08 19:20:00")
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
                        "_userId": first_set_new_apps_data[0]["user_id"],
                        "_metadata": f"""{{
                            "name": "{first_set_new_apps_data[0]["name"]}",
                            "description": "{first_set_new_apps_data[0]["description"]}",
                            "app_signature": {{"signature": "{first_set_new_apps_data[0]["app_signature"]["signature"]}",
                            "message": "{first_set_new_apps_data[0]["app_signature"]["message"]}"}},
                            "is_personal_access": {'true' if first_set_new_apps_data[0]["is_personal_access"] else 'false' }
                        }}""",
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
                        "_userId": first_set_new_apps_data[1]["user_id"],
                        "_action": Action.CREATE,
                        "_metadata": f"""{{
                            "name": "{first_set_new_apps_data[1]["name"]}",
                            "description": "{first_set_new_apps_data[1]["description"]}",
                            "image_url": "{first_set_new_apps_data[1]["image_url"]}",
                            "app_signature": {{"signature": "{first_set_new_apps_data[1]["app_signature"]["signature"]}",
                            "message": "{first_set_new_apps_data[1]["app_signature"]["message"]}"}},
                            "is_personal_access": {'true' if first_set_new_apps_data[1]["is_personal_access"] else 'false' }
                        }}""",
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
                        "_userId": first_set_new_apps_data[2]["user_id"],
                        "_action": Action.CREATE,
                        "_metadata": f"""{{
                            "name": "{first_set_new_apps_data[2]["name"]}",
                            "app_signature": {{"signature": "{first_set_new_apps_data[2]["app_signature"]["signature"]}",
                            "message": "{first_set_new_apps_data[2]["app_signature"]["message"]}"}}
                        }}""",
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "CreateAppTx4": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": first_set_new_apps_data[3]["user_id"],
                        "_action": Action.CREATE,
                        "_metadata": f"""{{
                            "name": "{first_set_new_apps_data[3]["name"]}",
                            "app_signature": {{"signature": "{first_set_new_apps_data[3]["app_signature"]["signature"]}",
                            "message": "{first_set_new_apps_data[3]["app_signature"]["message"]}"}}
                        }}""",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateAppTx5": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": first_set_new_apps_data[4]["user_id"],
                        "_action": Action.CREATE,
                        "_metadata": f"""{{
                            "name": "{first_set_new_apps_data[4]["name"]}",
                            "app_signature": {{"signature": "{first_set_new_apps_data[4]["app_signature"]["signature"]}",
                            "message": "{first_set_new_apps_data[4]["app_signature"]["message"]}"}}
                        }}""",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateAppTx6": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": first_set_new_apps_data[5]["user_id"],
                        "_action": Action.CREATE,
                        "_metadata": f"""{{
                            "name": "{first_set_new_apps_data[5]["name"]}",
                            "app_signature": {{"signature": "{first_set_new_apps_data[5]["app_signature"]["signature"]}",
                            "message": "{first_set_new_apps_data[5]["app_signature"]["message"]}"}}
                        }}""",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    def get_events_side_effect(_, tx_receipt: TxReceipt):
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
            # Private key: fcacb6c31a5b6bfd506a277ea34efcc44465476457385220fc252d7e58d6f2e7
        ]
        + [{"user_id": 99, "wallet": "0xE2975eF7594353238Cc68ECCf5d444c47BC17058"}],
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
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1000000000,
            block_hash=hex(0),
        )

        # validate db records
        all_apps: List[DeveloperApp] = session.query(DeveloperApp).all()
        assert len(all_apps) == 5
        for expected_app in first_set_new_apps_data:
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
            expected_image_url = expected_app.get("image_url", None)
            assert res.image_url == (
                expected_image_url
                if expected_image_url and expected_image_url.startswith("http")
                else None
            )
            assert res.is_personal_access == expected_app.get(
                "is_personal_access", False
            )
            assert res.blocknumber == 0

    # # Test invalid create app txs
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
                        "_metadata": '{"name": "Wrong Signer", "app_signature": {"signature": "949b7bad5ba5a1bc1e28212673e2d2786d7b85561eca8f0b9d962ffd42393dd041cf2c6b11418a97fd4f2b9a7fbaab26308795bb872ab9a39d1b4cb94935931e1c", "message": "Creating Audius developer app at 1686252026"}, "is_personal_access": false}',
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
                        "_metadata": '{"name": "Dupe address", "app_signature": {"signature": "f5a13e71d33d38c35966d4ebbbabc82d7f148fd206336e3136337c97947c9a946421248b999e8945a5830349d3b7129f83ac3827fb0b4191b56ae6ce4f26ac3a1b", "message": "Creating Audius developer app at 1686252028"}, "is_personal_access": false}',
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
                        "_metadata": '{"name": "Missing user id", "app_signature": {"signature": "949b7bad5ba5a1bc1e28212673e2d2786d7b85561eca8f0b9d962ffd42393dd041cf2c6b11418a97fd4f2b9a7fbaab26308795bb872ab9a39d1b4cb94935931e1c", "message": "Creating Audius developer app at 1686252026"}, "is_personal_access": false}',
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
                        "_metadata": """{"app_signature": {"signature": "949b7bad5ba5a1bc1e28212673e2d2786d7b85561eca8f0b9d962ffd42393dd041cf2c6b11418a97fd4f2b9a7fbaab26308795bb872ab9a39d1b4cb94935931e1c", "message": "Creating Audius developer app at 1686252026"}}""",
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
                        "_metadata": '{"app_signature": {"signature": "949b7bad5ba5a1bc1e28212673e2d2786d7b85561eca8f0b9d962ffd42393dd041cf2c6b11418a97fd4f2b9a7fbaab26308795bb872ab9a39d1b4cb94935931e1c", "message": "Creating Audius developer app at 1686252026"}, "name": "My app", "description": "The picket fence had stood for years without any issue. That was all it was. A simple, white, picket fence. Why it had all of a sudden become a lightning rod within the community was still unbelievable to most."}',
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
                        "_metadata": '{"app_signature": {"signature": "949b7bad5ba5a1bc1e28212673e2d2786d7b85561eca8f0b9d962ffd42393dd041cf2c6b11418a97fd4f2b9a7fbaab26308795bb872ab9a39d1b4cb94935931e1c", "message": "Creating Audius developer app at 1686252026"}, "name": "My app", "description": false}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "CreateAppInvalidTx7": [
            {
                # Not the right message in signature
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": 2,
                        "_action": Action.CREATE,
                        "_metadata": '{"app_signature": {"signature": "0x517e1a2b3c6a7a33ef22b8e6054825b435b18247e70200c757d3e5e64ec417f852a8efbe3cf882b39868dc9eb1f1439230145b9ec7cd3206e30f35e63948fb781b", "message": "Hey There"}, "name": "My app"}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "CreateAppInvalidTx8": [
            {
                # Bad signature format
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": 2,
                        "_action": Action.CREATE,
                        "_metadata": '{"app_signature": "949b7bad5ba5a1bc1e28212673e2d2786d7b85561eca8f0b9d962ffd42393dd041cf2c6b11418a97fd4f2b9a7fbaab26308795bb872ab9a39d1b4cb94935931e1c", "name": "My app"}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "CreateAppInvalidTx9": [
            {
                # Timestamp in signature message too old
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": 2,
                        "_action": Action.CREATE,
                        "_metadata": '{"app_signature": {"signature": "c614d92de7ebad7566e5b8014df916cacba1c41c91fbf431591010a71efc00686291b9a09e9d2fd1caf7613366bd441f1ff48d77d666db846cecf2781021d9d41c", "message": "Creating Audius developer app at 1686200400"}, "name": "My app"}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "CreateAppInvalidTx10": [
            {
                # Too many apps
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": 1,
                        "_action": Action.CREATE,
                        "_metadata": '{"name": "Too many apps", "app_signature": {"signature": "58404f470e94e02d34ec3706b46c1538dc791c939d9a48a66057354bb51afbcb7449a7bcbc308f12513e975d3974290da852d1a1308f4a81a8228707d8fc6f261c", "message": "Creating Audius developer app at 1686252026"}, "is_personal_access": false}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateAppInvalidTx11": [
            {
                # Name is too long
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": 2,
                        "_action": Action.CREATE,
                        "_metadata": '{"app_signature": {"signature": "949b7bad5ba5a1bc1e28212673e2d2786d7b85561eca8f0b9d962ffd42393dd041cf2c6b11418a97fd4f2b9a7fbaab26308795bb872ab9a39d1b4cb94935931e1c", "message": "Creating Audius developer app at 1686252026"}, "name": "My really long app name this is really long we will rock you"}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "CreateAppInvalidTx12": [
            {
                # Address is a user's wallet
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": 2,
                        "_action": Action.CREATE,
                        "_metadata": '{"app_signature": {"signature": "20e5b1d95cc5d942571a097b5d7cb30cfcf355bbb5a51df498914dc42f4472d53c0d5ee9d2d89a00b56d19c912fade6760daa7f4c62437c5251776bd34cc4f3c1c", "message": "Creating Audius developer app at 1686252026"}, "name": "My app name"}',
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
            block_number=1,
            block_timestamp=timestamp,
            block_hash=hex(0),
        )
        # validate db records
        all_apps: List[DeveloperApp] = session.query(DeveloperApp).all()
        # make sure no new rows were added
        assert len(all_apps) == 7

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
                        "_userId": first_set_new_apps_data[0]["user_id"],
                        "_metadata": f"""{{"address": "{first_set_new_apps_data[0]["address"]}"}}""",
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
                        "_metadata": f"""{{"address": "{first_set_new_apps_data[2]["address"]}"}}""",
                        "_signer": "user1wallet",
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
            block_number=2,
            block_timestamp=timestamp,
            block_hash=hex(0),
        )
        # validate db records
        all_apps: List[DeveloperApp] = session.query(DeveloperApp).all()
        # make sure no new rows were added
        assert len(all_apps) == 7

    # Test valid delete app txs
    tx_receipts = {
        "DeleteAppTx1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_action": Action.DELETE,
                        "_userId": first_set_new_apps_data[0]["user_id"],
                        "_metadata": f"""{{"address": "{first_set_new_apps_data[0]["address"]}"}}""",
                        "_signer": f"user{first_set_new_apps_data[0]['user_id']}wallet",
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
                        "_userId": first_set_new_apps_data[1]["user_id"],
                        "_metadata": f"""{{"address": "{first_set_new_apps_data[1]["address"]}"}}""",
                        "_signer": f"user{first_set_new_apps_data[1]['user_id']}wallet",
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
                        "_userId": first_set_new_apps_data[2]["user_id"],
                        "_metadata": f"""{{"address": "{first_set_new_apps_data[2]["address"]}"}}""",
                        "_signer": f"user{first_set_new_apps_data[2]['user_id']}wallet",
                    }
                )
            },
        ],
        "DeleteAppTx4": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_action": Action.DELETE,
                        "_userId": first_set_new_apps_data[3]["user_id"],
                        "_metadata": f"""{{"address": "{first_set_new_apps_data[3]["address"]}"}}""",
                        "_signer": f"user{first_set_new_apps_data[3]['user_id']}wallet",
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
            block_number=3,
            block_timestamp=timestamp,
            block_hash=hex(0),
        )
        # validate db records
        all_apps: List[DeveloperApp] = session.query(DeveloperApp).all()
        assert len(all_apps) == 7

        for expected_app in first_set_new_apps_data:
            found_matches = [
                item
                for item in all_apps
                if item.address == expected_app["address"].lower()
            ]
            assert len(found_matches) == 1
            updated = [item for item in found_matches if item.is_current == True]
            assert len(updated) == 1
            updated = updated[0]
            assert updated.user_id == expected_app["user_id"]
            assert updated.name == expected_app["name"]
            assert updated.description == (
                expected_app.get("description", None) or None
            )
            assert updated.is_personal_access == expected_app.get(
                "is_personal_access", False
            )
            assert updated.is_delete == True
            assert updated.blocknumber == 3

    # Test valid create again
    tx_receipts = {
        "CreateAppTx6": [  # Make sure user 1 can make another app since they now have fewer than 5 non-deleted apps
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": second_set_new_apps_data[0]["user_id"],
                        "_metadata": f"""{{"name": "{second_set_new_apps_data[0]["name"]}", "description": "{second_set_new_apps_data[0]["description"]}", "app_signature": {{"signature": "{second_set_new_apps_data[0]["app_signature"]["signature"]}", "message": "{second_set_new_apps_data[0]["app_signature"]["message"]}"}}}}""",
                        "_action": Action.CREATE,
                        "_signer": f"user{second_set_new_apps_data[0]['user_id']}wallet",
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
            block_number=4,
            block_timestamp=1000000003,
            block_hash=hex(0),
        )

        # validate db records
        all_apps: List[DeveloperApp] = session.query(DeveloperApp).all()
        assert len(all_apps) == 6
        for expected_app in second_set_new_apps_data:
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
            assert res.blocknumber == 4


@freeze_time("2023-06-08 19:20:00")
def test_developer_app_update(app, mocker):
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, None)

    # Create one app first
    tx_receipts = {
        "CreateAppTx1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": first_set_new_apps_data[1]["user_id"],
                        "_action": Action.CREATE,
                        "_metadata": f"""{{
                            "name": "{first_set_new_apps_data[1]["name"]}",
                            "description": "{first_set_new_apps_data[1]["description"]}",
                            "image_url": "{first_set_new_apps_data[1]["image_url"]}",
                            "app_signature": {{"signature": "{first_set_new_apps_data[1]["app_signature"]["signature"]}",
                            "message": "{first_set_new_apps_data[1]["app_signature"]["message"]}"}},
                            "is_personal_access": {'true' if first_set_new_apps_data[1]["is_personal_access"] else 'false' }
                        }}""",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    def get_events_side_effect(_, tx_receipt: TxReceipt):
        return tx_receipts[tx_receipt["transactionHash"].decode("utf-8")]

    mocker.patch(
        "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
        side_effect=get_events_side_effect,
        autospec=True,
    )

    entities = {
        "users": [
            {"user_id": 1, "wallet": f"user{1}wallet"},
            # Unused second user to trigger more blocks to exist
            {"user_id": 2, "wallet": f"user{2}wallet"},
        ]
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1000000000,
            block_hash=hex(0),
        )

        # validate db records
        all_apps: List[DeveloperApp] = session.query(DeveloperApp).all()
        assert len(all_apps) == 1
        app = all_apps[0]
        assert app.address == first_set_new_apps_data[1]["address"]
        assert app.name == first_set_new_apps_data[1]["name"]
        assert not app.description
        assert app.image_url == first_set_new_apps_data[1]["image_url"]

    # Update the created app
    tx_receipts = {
        "UpdateAppTx1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DEVELOPER_APP,
                        "_userId": first_set_new_apps_data[1]["user_id"],
                        "_metadata": f"""{{
                            "address": "{first_set_new_apps_data[1]["address"]}",
                            "name": "Updated Name",
                            "description": "Updated Desc",
                            "image_url": "https://example.com"
                        }}""",
                        "_action": Action.UPDATE,
                        "_signer": "user1wallet",
                    }
                )
            },
        ]
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
            block_number=1,
            block_timestamp=timestamp,
            block_hash=hex(0),
        )
        # validate db records
        all_apps: List[DeveloperApp] = session.query(DeveloperApp).all()
        app = all_apps[0]
        assert len(all_apps) == 1
        assert app.name == "Updated Name"
        assert app.description == "Updated Desc"
        assert app.image_url == "https://example.com"
