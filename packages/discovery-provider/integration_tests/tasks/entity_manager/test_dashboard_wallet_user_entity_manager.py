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
    },
    {
        # 0x09439dc8d52396c29e4414664C84f36Cf9A8d500
        # eaedfd9295db6c513c59d77c14f49ba2ae8aa5910433594cc144fecd0b085790
        "wallet": "0x09439dc8d52396c29e4414664C84f36Cf9A8d500",
        "user_id": 5,
        "user_signature": {
            "signature": "c8fc661fb47f76d165154e2906561c5f18b58bf4f39704d630144730207fc1d475f3127456622d2c48d4c828837d995dade7e696bb91c808aa93985120a8884f1c",
            "message": "Connecting Audius protocol dashboard wallet 0x09439dc8d52396c29e4414664C84f36Cf9A8d500 at 1686252024",
        },
    },
    {
        "wallet": "0xe05aC1EfC30cE2F7615186802E2B14CC8759616F",
        # 0634902d1af06d2da2ac9badd6718e210b028d753b89b93aaeba8e4438bad4ae
        "user_id": 2,
        "wallet_signature": {
            "signature": "5e38c49b2a0d8157a672d5ccd10abb54758967833efd69c25fbe530e339b00d16d665e1d21688ab629db292d401d53e95cb5701420eaa5fb2cfffbe959cb72f51c",
            "message": "Connecting Audius user @user_2 at 1686252024",
        },
    },
]


user_wallets = {
    5: "0xE4491e30992d53873301a7a28Ae2ff7F6Fa818f2"
    # de5e5f8fbae5683eeb2ec93553d0d4189f40af50f45064543d6a36d764ba0e1a
}

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
        ],
        "CreateDashboardWalletUserTx4": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": new_dashboard_wallet_users_data[3]["user_id"],
                        "_action": Action.CREATE,
                        "_metadata": f"""{{"wallet": "{new_dashboard_wallet_users_data[3]["wallet"]}", "user_signature": {{"signature": "{new_dashboard_wallet_users_data[3]["user_signature"]["signature"]}", "message": "{new_dashboard_wallet_users_data[3]["user_signature"]["message"]}"}}}}""",
                        "_signer": "0x09439dc8d52396c29e4414664C84f36Cf9A8d500",
                    }
                )
            },
        ],
        "CreateDashboardWalletUserTx5": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": new_dashboard_wallet_users_data[4]["user_id"],
                        "_action": Action.CREATE,
                        "_metadata": f"""{{"wallet": "{new_dashboard_wallet_users_data[4]["wallet"]}", "wallet_signature": {{"signature": "{new_dashboard_wallet_users_data[4]["wallet_signature"]["signature"]}", "message": "{new_dashboard_wallet_users_data[4]["wallet_signature"]["message"]}"}}}}""",
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

    def get_events_side_effect(_, tx_receipt: TxReceipt):
        return tx_receipts[tx_receipt["transactionHash"].decode("utf-8")]

    mocker.patch(
        "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
        side_effect=get_events_side_effect,
        autospec=True,
    )

    entities = {
        "users": [
            {
                "user_id": user_id,
                "wallet": user_wallets.get(user_id, None) or f"user{user_id}wallet",
                "handle": f"User_{user_id}",
            }
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
        assert len(all_dwus) == 6
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
                        "_metadata": """{"wallet": "0xd5d54a844e59c71e1fed525d5ee620c492296d8b", "wallet_signature": {"signature": "480b443ed0b758e3c16dcc43d0691ccdf523d84edbe8f3f337dc3f5a02b5b4212a3cad4162456dddc87dd5de1ccf12764037b15ea08b8e4480c38b81308e0da81c", "message": "Connecting Audius user id 4 at 1686252026"}}""",
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
                        "_metadata": """{"wallet": "0xd5d54a844e59c71e1fed525d5ee620c492296d8b","wallet_signature": {"signature": "0adebff40970622a3f93e715279a63860c133d82f9a418062d1c4d47f52ea4902518df5ac34ed5e41b1e1865fd572fd69d9a7588d019bb3dae69e73c958b57ee1b", "message": "Connecting Audius user id 2 at 1686252026"}}""",
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
                        "_metadata": """{"wallet": "0xff0b22214dbe20966f183648fbd92d5e569f02c5", "wallet_signature": {"signature": "736bec576740ffdc489ddeea8090524704f15c8b845ac4e097fb0efba283b24e677781b8db513b6caaabed9cfeb7304717f80a66d4991beb3794f81b7ce2df131c", "message": "Connecting Audius user id 4 at 1686252026"}}""",
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
                        "_metadata": """{"wallet": "0xD5d54a844e59C71e1Fed525D5ee620c492296D8B"}""",
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
                        "_metadata": """{"wallet": "0xD5d54a844e59C71e1Fed525D5ee620c492296D8B", "wallet_signature": {"signature": "e999d97423eacf1acf3669c566a2b1c651297c2a00fcafe4ae0260444572818859ef7ea2d8f4543a769db96011875857e89c38e5b53c9a90e2e3e4faf7e2478f1c", "message": "Hey there"}}""",
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
                        "_metadata": """{"wallet": "0xD5d54a844e59C71e1Fed525D5ee620c492296D8B", "wallet_signature": {"signature": "cd7b47a36c6c1c5615dfe264cd73839a484884c55e6f3ebad47ce79a5f24016e7569bba29016e5618375b5abbd93e10e80e51d8e0d47e6dba34930fa59e6470d1b", "message": "Connecting Audius user id 4 at 1686200400"}}""",
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
                        "_metadata": f"""{{"wallet": "{new_dashboard_wallet_users_data[0]["wallet"]}", "wallet_signature": {{"signature": "{new_dashboard_wallet_users_data[0]["wallet_signature"]["signature"]}", "message": "{new_dashboard_wallet_users_data[0]["wallet_signature"]["message"]}"}}}}""",
                        "_action": Action.CREATE,
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "CreateDashboardWalletUserInvalidTx9": [
            {
                # User signature - wrong wallet specified in msg
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": 5,
                        "_action": Action.CREATE,
                        "_metadata": """{"wallet": "0x5B905C04b15e3BD152224E9738dA726DF6d103B6", "user_signature": {"signature": "a7a2d4a4e33d40baad13dea3e3b83c8df67eee6a9977b76cc224c11586ac7578794fc6489d25f984aaafe7c5186b13dcf37fed94f700f46c6071e5def61e311a1c", "message": "Connecting Audius protocol dashboard wallet 0x1D72Df50f7d9538e988bDf1533EAc22fb0075EBc at 1686252026"}}""",
                        "_signer": "0x5B905C04b15e3BD152224E9738dA726DF6d103B6",
                    }
                )
            },
        ],
        "CreateDashboardWalletUserInvalidTx10": [
            {
                # Missing user signature
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": 5,
                        "_action": Action.CREATE,
                        "_metadata": """{"wallet": "0x1D72Df50f7d9538e988bDf1533EAc22fb0075EBc"}""",
                        "_signer": "0x1D72Df50f7d9538e988bDf1533EAc22fb0075EBc",
                    }
                )
            },
        ],
        "CreateDashboardWalletUserInvalidTx11": [
            {
                # Not the right message in user signature
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": 5,
                        "_action": Action.CREATE,
                        "_metadata": """{"wallet": "0xD5d54a844e59C71e1Fed525D5ee620c492296D8B", "user_signature": {"signature": "ec37a30631a1748a107ad815c215a0668710c0bb8d10e6eb562d52dbcfcb82dc1a512177bb956d8c2c5b2f184ab9c7f2be69a70ee90b1ba6f5512a639e63df6c1b", "message": "Hey there"}}""",
                        "_signer": "0xD5d54a844e59C71e1Fed525D5ee620c492296D8B",
                    }
                )
            },
        ],
        "CreateDashboardWalletUserInvalidTx12": [
            {
                # Bad user signature format
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": 5,
                        "_action": Action.CREATE,
                        "_metadata": '{"wallet": "0xD5d54a844e59C71e1Fed525D5ee620c492296D8B", "user_signature": "e9f6039fd06f96dbbee9d8d933424f2fa32dfa25075331f762adbd2b28f2dfba7b2bcec2f03b73757a8369766a82854b723f767c07b7bfda57938c2ec09b286d1b"}',
                        "_signer": "0xD5d54a844e59C71e1Fed525D5ee620c492296D8B",
                    }
                )
            },
        ],
        "CreateDashboardWalletUserInvalidTx13": [
            {
                # Timestamp in user signature message too old
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": 5,
                        "_action": Action.CREATE,
                        "_metadata": """{"wallet": "0xD5d54a844e59C71e1Fed525D5ee620c492296D8B", "user_signature": {"signature": "284d678115dcc59f90a55cf1935fd8b691f9122f97db0d5d07688c59cee40377467e234ffc2ccb6501b35f05dbdae29cbb9b7e49537400410ec40880297694251c", "message": "Connecting Audius protocol dashboard wallet 0xD5d54a844e59C71e1Fed525D5ee620c492296D8B at 1686200400"}}""",
                        "_signer": "0xD5d54a844e59C71e1Fed525D5ee620c492296D8B",
                    }
                )
            },
        ],
        "CreateDashboardWalletUserInvalidTx14": [
            {
                # Used wallet signature when tx signer was wallet
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": 5,
                        "_action": Action.CREATE,
                        # 23eedde12523b5bb837183d40b457469e15ab3c0bf731ee002ab984d726ea0c5
                        "_metadata": """{"wallet": "0x5B905C04b15e3BD152224E9738dA726DF6d103B6", "wallet_signature": {"signature": "8429bb5f85c34e532515205cf937f4fcc16f9d4e9118c836e23c8c089acf85264632588569a1231b2e4b2fb8d78cc94f11e686a957db6c508231d19f4ab6c8cb1b", "message": "Connecting Audius user id 5 at 1686252026"}}""",
                        "_signer": "0x5B905C04b15e3BD152224E9738dA726DF6d103B6",
                    }
                )
            },
        ],
        "CreateDashboardWalletUserInvalidTx15": [
            {
                # Used user signature when tx signer was user
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": 5,
                        "_action": Action.CREATE,
                        "_metadata": """{"wallet": "0x5B905C04b15e3BD152224E9738dA726DF6d103B6", "user_signature": {"signature": "02192d53849b7cdf39b3fe81630dcbc8a9b34e57be0f0ef9dbeea0d6a3aaef4e50c381c7db74c7dd953ff1d8996c1cc3c482dcf618a23dc9ad6af446b4adbe871c", "message": "Connecting Audius protocol dashboard wallet 0x5B905C04b15e3BD152224E9738dA726DF6d103B6 at 1686252026"}}""",
                        "_signer": user_wallets[5],
                    }
                )
            },
        ],
        "CreateDashboardWalletUserInvalidTx16": [
            {
                # Handle in wallet signature incorrect
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": 4,
                        "_action": Action.CREATE,
                        "_metadata": """{"wallet": "0x5B905C04b15e3BD152224E9738dA726DF6d103B6", "wallet_signature": {"signature": "d4421fbf7e0275fd9caa20cd65a347f2dcab339490918862463caf1bc68459984641640d76cde8ecae7b9fce045e3d975351176fca61b28450279a78ca1489961b", "message": "Connecting Audius user @beep at 1686252026"}}""",
                        "_signer": "user4wallet",
                    }
                )
            },
        ],
        "CreateDashboardWalletUserInvalidTx17": [
            {
                # Wallet signature message has extra words (handle format)
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": 4,
                        "_action": Action.CREATE,
                        "_metadata": """{"wallet": "0x5B905C04b15e3BD152224E9738dA726DF6d103B6", "wallet_signature": {"signature": "a1e77d57b020b5ba9d0025fe827e24ad271f52bca1d4c0a7640fc825bc651f8564cf72aae2d42f9e3688fd4686ff57671413d01b1c2d66e626ca62d0546c1ab81c", "message": "Connecting Audius user @User_4 Kangaroo at 1686252026"}}""",
                        "_signer": "user4wallet",
                    }
                )
            },
        ],
        "CreateDashboardWalletUserInvalidTx18": [
            {
                # Wallet signature message has extra words (user id format)
                "args": AttributeDict(
                    {
                        "_entityId": 0,
                        "_entityType": EntityType.DASHBOARD_WALLET_USER,
                        "_userId": 4,
                        "_action": Action.CREATE,
                        "_metadata": """{"wallet": "0x5B905C04b15e3BD152224E9738dA726DF6d103B6", "wallet_signature": {"signature": "50d65bdc7f3c6b364258f5fac4f74d570b2b74a8e6547cc1495a339803b6decb13d7420789bc2c9679eda4aabb72d028c1f0857bfce755c1ace6213ea2f9add51c", "message": "Connecting Audius user id 4 Kangaroo at 1686252026"}}""",
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
            block_number=1,
            block_timestamp=timestamp,
            block_hash=hex(0),
        )
        # validate db records
        all_dwus: List[DashboardWalletUser] = session.query(DashboardWalletUser).all()
        # make sure no new rows were added
        assert len(all_dwus) == 6

    # # Test invalid delete txs
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
        assert len(all_dwus) == 6

    expected_deleted_items = [
        new_dashboard_wallet_users_data[0],
        new_dashboard_wallet_users_data[2],
    ]
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
        all_dwus: List[DashboardWalletUser] = session.query(DashboardWalletUser).all()
        assert len(all_dwus) == 6

        for expected_item in expected_deleted_items:
            found_matches = [
                item
                for item in all_dwus
                if item.wallet == expected_item["wallet"].lower()
            ]
            assert len(found_matches) == 1
            updated = [item for item in found_matches]
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
                        "_userId": second_set_new_dashboard_wallet_users_data[0][
                            "user_id"
                        ],
                        "_metadata": f"""{{"wallet": "{second_set_new_dashboard_wallet_users_data[0]["wallet"]}", "wallet_signature": {{"signature": "{second_set_new_dashboard_wallet_users_data[0]["wallet_signature"]["signature"]}", "message": "{second_set_new_dashboard_wallet_users_data[0]["wallet_signature"]["message"]}"}}}}""",
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
        assert len(all_dwus) == 6
        for expected_item in second_set_new_dashboard_wallet_users_data:
            found_matches = [
                item
                for item in all_dwus
                if item.wallet == expected_item["wallet"].lower()
            ]
            assert len(found_matches) == 1
            res = found_matches[0]
            assert res.user_id == expected_item["user_id"]
            assert res.is_delete == False
            assert res.blocknumber == 4
