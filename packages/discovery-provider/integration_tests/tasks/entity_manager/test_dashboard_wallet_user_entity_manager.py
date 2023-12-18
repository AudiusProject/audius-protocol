from typing import List

from freezegun import freeze_time
from web3 import Web3
from web3.datastructures import AttributeDict
from web3.types import TxReceipt

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.models.dashboard_wallet_user.dashboard_wallet_user import DashboardWalletUser
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.utils import Action, EntityType
from src.utils.db_session import get_db

new_dashboard_wallet_users_data = [
    {
        "wallet": "0xa340840f48bd0a7a972b7a3fe6d8007c0389590b",
        "user_id": 1,
        "wallet_signature": {
            "signature": "0adb886035c1f94be9d6ef3aa2cbff42cdcb5d1ff76570b4f71a459d978b56355ceb6f42307a05d47f2deda1c4175c0054981c6d3052a051f585ed3a7bcd5f691c",
            "message": "Connecting Audius user id 1 at 1686252026",
        },
    },
    {
        "wallet": "0xc541167fcecbdcfde395652025a1d005a09e092d",
        "user_id": 1,
        "wallet_signature": {
            "signature": "b9c55a9e7136af723ca7b4cb4942faabd0f1f04f4e35dca840c144d8e647ef1010607bedee113ed7948ae330bdf17af3948e50b72e0e5375161f49d2846ca4221b",
            "message": "Connecting Audius user id 7eP5n at 1686252026",
        },
    },
    {
        "wallet": "0xed27455f97cf421507f236260eca91d0f6237050",
        "user_id": 2,
        "wallet_signature": {
            "signature": "cc3f6447d5a02215e2c5046c6fd43fb21b421c7cdecd886af30ca23a75a9735a68f7feef1c58c9d72507e9c24472cfda9a448a6ea051bf7a58faa95ca43025a11b",
            "message": "Connecting Audius user id 2 at 1686252024",
        },
    }
]

second_set_new_dashboard_wallet_users_data = [
    {
        # Same as first DWU from above set, but different user
        "wallet": "0xa340840f48bd0a7a972b7a3fe6d8007c0389590b",
        "user_id": 3,
        "wallet_signature": {
            "signature": "d07df3ee9cf9402f5ff959ab7f1d28c4ee6d3694ec619a988cd10d4f9e8ee713467a94fbf28c3ca2036980c765d8efb0b8b0cfad68b864268fa88b7cb7f89e461c",
            "message": "Connecting Audius user id 3 at 1686252026",
        },
    },
]


@freeze_time("2023-06-08 19:20:00")
def test_index_dashboard_wallet_user(app, mocker):
    "Tests dashboard wallet user action"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, None)

    """"
    const resp = await this.manageEntity({
        userId,
        entityType: EntityType.DASHBOARD_WALLET_USER,
        entityId: 0,
        action: Action.CREATE,
        metadataMultihash: ''
      })
    """
    tx_receipts = {
        "CreateDashboardWalletUserTx1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": new_dashboard_wallet_users_data[0]["user_id"],
                        "_metadata": f"""{{"wallet": "{new_dashboard_wallet_users_data[0]["wallet"]}", "wallet_signature": {{"signature": "{new_dashboard_wallet_users_data[0]["wallet_signature"]["signature"]}", "message": "{new_dashboard_wallet_users_data[0]["wallet_signature"]["message"]}"}}}}""",
                        "_action": Action.CREATE,
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateDashboardWalletUserTx2": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": new_dashboard_wallet_users_data[1]["user_id"],
                        "_metadata": f"""{{"wallet": "{new_dashboard_wallet_users_data[1]["wallet"]}", "wallet_signature": {{"signature": "{new_dashboard_wallet_users_data[1]["wallet_signature"]["signature"]}", "message": "{new_dashboard_wallet_users_data[1]["wallet_signature"]["message"]}"}}}}""",
                        "_action": Action.CREATE,
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateDashboardWalletUserTx3": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": new_dashboard_wallet_users_data[2]["user_id"],
                        "_action": Action.CREATE,
                        "_metadata": f"""{{"wallet": "{new_dashboard_wallet_users_data[2]["wallet"]}", "wallet_signature": {{"signature": "{new_dashboard_wallet_users_data[2]["wallet_signature"]["signature"]}", "message": "{new_dashboard_wallet_users_data[2]["wallet_signature"]["message"]}"}}}}""",
                        "_signer": "user2wallet",
                    }
                )
            },
        ]
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
        ],
        "dashboard_wallet_users": [
            {
                "user_id": 5,
                "wallet": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4C4",
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
        all_dwus: List[DashboardWalletUser] = session.query(DashboardWalletUser).all()
        assert len(all_dwus) == 4
        for expected_item in new_dashboard_wallet_users_data:
            found_matches = [
                item
                for item in all_dwus
                if item.wallet == expected_item["wallet"].lower()
            ]
            assert len(found_matches) == 1
            res = found_matches[0]
            assert res.user_id == expected_item["user_id"]
            assert res.blocknumber == 0

    # Test invalid create dashboard wallet user txs
    tx_receipts = {
        "CreateDashboardWalletUserInvalidTx1": [
            { 
                # Incorrect signer - user
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": 4,
                        "_action": Action.CREATE,
                        "_metadata": f"""{{"wallet": "0xD5d54a844e59C71e1Fed525D5ee620c492296D8B", "wallet_signature": {{"signature": "e130e523aaa72b22f28ea5116ebb319f417228ecaf8996fd69043acc4e2412ba28b61cc55e9f0cc0e0d5da486c5c1809bfd86981a5440f14aecec938b898e4501c", "message": "Connecting Audius user 4 at 1686252026"}}}}""",
                        "_signer": "0xD5d54a844e59C71e1Fed525D5ee620c492296D8B",
                    }
                )
            },
        ],
        "CreateDashboardWalletUserInvalidTx2": [
            {
                # Incorrect message - not the right user id
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": 4,
                        "_action": Action.CREATE,
                        "_metadata": f"""{{"wallet": "0xD5d54a844e59C71e1Fed525D5ee620c492296D8B","wallet_signature": {{"signature": "42658f714e23596975894e67241635fd83f2c1c3bd72ba6044eb2a4f72f77b6475f87a6118350cca291c211ae16157614ffc0bfca9ed7d2ad8532150389bc02a1c", "message": "Connecting Audius user 2 at 1686252026"}}}}""",
                        "_signer": "user4wallet",
                    }
                )
            },
        ],
        "CreateDashboardWalletUserInvalidTx3": [
            {
                # Wallet signature wrong
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": 4,
                        "_action": Action.CREATE,
                        "_metadata": f"""{{"wallet": "0xD5d54a844e59C71e1Fed525D5ee620c492296D8B", "wallet_signature": {{"signature": "76a6c2a6789b95b98d1cc5cb94f96392c6e3fbb30d1a5e7d91634b995adeadc31b023bd97ebaa7edfd56d216a2b0fada6be1927459ad101be20c586a2e9c3f0e1b", "message": "Connecting Audius user 4 at 1686252026"}}}}""",
                        "_signer": "user4wallet",
                    }
                )
            },
        ],
        "CreateDashboardWalletUserInvalidTx4": [
            {
                # Missing wallet signature
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": 4,
                        "_action": Action.CREATE,
                        "_metadata": f"""{{"wallet": "0xD5d54a844e59C71e1Fed525D5ee620c492296D8B"}}""",
                        "_signer": "user4wallet",
                    }
                )
            },
        ],
        "CreateDashboardWalletUserInvalidTx5": [
            {
                # Not the right message in signature
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": 4,
                        "_action": Action.CREATE,
                        "_metadata": f"""{{"wallet": "0xD5d54a844e59C71e1Fed525D5ee620c492296D8B", "wallet_signature": {{"signature": "e999d97423eacf1acf3669c566a2b1c651297c2a00fcafe4ae0260444572818859ef7ea2d8f4543a769db96011875857e89c38e5b53c9a90e2e3e4faf7e2478f1c", "message": "Hey there"}}}}""",
                        "_signer": "user4wallet",
                    }
                )
            },
        ],
        "CreateDashboardWalletUserInvalidTx6": [
            {
                # Bad signature format
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": 2,
                        "_action": Action.CREATE,
                        "_metadata": '{"wallet_signature": "42658f714e23596975894e67241635fd83f2c1c3bd72ba6044eb2a4f72f77b6475f87a6118350cca291c211ae16157614ffc0bfca9ed7d2ad8532150389bc02a1c"}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "CreateDashboardWalletUserInvalidTx7": [
            {
                # Timestamp in signature message too old
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": 4,
                        "_action": Action.CREATE,
                        "_metadata": f"""{{"wallet": "0xD5d54a844e59C71e1Fed525D5ee620c492296D8B", "wallet_signature": {{"signature": "f8872b78c28e64e0ac70d381e71728d5c2677448f4c21e5805eacba63990ee592cfa2dc9a95ce1cb5bf219d074450b7ad9f5591ea174caddd97ec812372f34021b", "message": "Connecting Audius user 4 at 1686200400"}}}}""",
                        "_signer": "user4wallet",
                    }
                )
            },
        ],
        "CreateDashboardWalletUserInvalidTx8": [
            {
                # Duplicate wallet
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": 2,
                        "_metadata": f"""{{"wallet": "{new_dashboard_wallet_users_data[0]["wallet"]}", wallet_signature": {{"signature": "{new_dashboard_wallet_users_data[0]["wallet_signature"]["signature"]}", "message": "{new_dashboard_wallet_users_data[0]["wallet_signature"]["message"]}"}}}}""",
                        "_action": Action.CREATE,
                        "_signer": "user2wallet",
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
        all_dwus: List[DashboardWalletUser] = session.query(DashboardWalletUser).all()
        # make sure no new rows were added
        assert len(all_dwus) == 4

    # Test invalid delete txs
    tx_receipts = {
        "DeleteDashboardWalletUserInvalidTx1": [
            {
                # Incorrect signer
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_action": Action.DELETE,
                        "_userId": new_dashboard_wallet_users_data[0]["user_id"],
                        "_metadata": f"""{{"wallet": "{new_dashboard_wallet_users_data[0]["wallet"]}"}}""",
                        "_signer": "incorrectwallet",
                    }
                )
            },
        ],
        "DeleteDashboardWalletUserInvalidTx2": [
            {
                # Dashboard wallet user doesn't exist
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": 2,
                        "_action": Action.DELETE,
                        "_metadata": '{"wallet": "0x4D66645bC8Ac35c02a23bac8D795F9C9Fe765012"}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "DeleteDashboardWalletUserInvalidTx3": [
            {
                # User id doesn't match
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_action": Action.DELETE,
                        "_userId": 4,
                        "_metadata": f"""{{"wallet": "{new_dashboard_wallet_users_data[0]["wallet"]}"}}""",
                        "_signer": "user4wallet",
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
        all_dwus: List[DashboardWalletUser] = session.query(DashboardWalletUser).all()
        # make sure no new rows were added or deleted
        assert len(all_dwus) == 4

    # Test valid delete txs
    tx_receipts = {
        "DeleteDashboardWalletUserTx1": [
            {
                "args": AttributeDict(
                    {
                        # Delete with user as signer
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_action": Action.DELETE,
                        "_userId": new_dashboard_wallet_users_data[0]["user_id"],
                        "_metadata": f"""{{"wallet": "{new_dashboard_wallet_users_data[0]["wallet"]}"}}""",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "DeleteDashboardWalletUserTx2": [
            {
                "args": AttributeDict(
                    {
                        # Delete with wallet as signer
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_action": Action.DELETE,
                        "_userId": new_dashboard_wallet_users_data[2]["user_id"],
                        "_metadata": f"""{{"wallet": "{new_dashboard_wallet_users_data[2]["wallet"]}"}}""",
                        "_signer": new_dashboard_wallet_users_data[2]["wallet"],
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
            block_number=3,
            block_timestamp=timestamp,
            block_hash=hex(0),
        )
        # validate db records
        all_dwus: List[DashboardWalletUser] = session.query(DashboardWalletUser).all()
        assert len(all_dwus) == 4

        for expected_item in new_dashboard_wallet_users_data:
            found_matches = [
                item
                for item in all_dwus
                if item.wallet == expected_item["wallet"].lower()
            ]
            assert len(found_matches) == 1
            updated = [item for item in found_matches if item.is_current == True]
            assert len(updated) == 1
            updated = updated[0]
            assert updated.user_id == expected_item["user_id"]
            assert updated.wallet == expected_item["wallet"]
            assert updated.is_delete == True
            assert updated.blocknumber == 3

    # Test valid create again
    tx_receipts = {
        "CreateDashboarWalletUserTx4": [  # Make sure wallet can be connected to another user
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": second_set_new_dashboard_wallet_users_data[0]["userId"],
                        "_metadata": f"""{{"wallet": "{second_set_new_dashboard_wallet_users_data[0]["wallet"]}, "wallet_signature": {{"signature": "{second_set_new_dashboard_wallet_users_data[0]["wallet_signature"]["signature"]}", "message": "{second_set_new_dashboard_wallet_users_data[0]["wallet_signature"]["message"]}"}}}}""",
                        "_action": Action.CREATE,
                        "_signer": "user3wallet",
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
        all_dwus: List[DashboardWalletUser] = session.query(DashboardWalletUser).all()
        assert len(all_dwus) == 5
        for expected_item in second_set_new_dashboard_wallet_users_data:
            found_matches = [
                item
                for item in all_dwus
                if item.address == expected_item["wallet"].lower()
            ]
            assert len(found_matches) == 1
            res = found_matches[0]
            assert res.user_id == expected_item["user_id"]
            assert res.blocknumber == 4
