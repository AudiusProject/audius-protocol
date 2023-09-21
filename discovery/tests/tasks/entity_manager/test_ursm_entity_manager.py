from typing import List

from web3 import Web3
from web3.datastructures import AttributeDict

from src.challenges.challenge_event_bus import ChallengeEventBus, setup_challenge_bus
from src.models.users.user import User
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.utils.db_session import get_db
from src.utils.eth_manager import EthManager
from tests.challenges.index_helpers import UpdateTask
from tests.utils import populate_mock_db


def set_patches(mocker):
    mocker.patch(
        "src.tasks.entity_manager.entities.user_replica_set.get_endpoint_string_from_sp_ids",
        return_value="https://cn.io,https://cn2.io,https://cn3.io",
        autospec=True,
    )

    def fetch_node_info(self, sp_id, sp_type, redis):
        return {
            "operator_wallet": "wallet1",
            "endpoint": "http://endpoint.io",
            "block_number": sp_id,
            "delegator_wallet": f"spid{sp_id}",
        }

    mocker.patch(
        "src.utils.eth_manager.EthManager.fetch_node_info",
        side_effect=fetch_node_info,
        autospec=True,
    )


def test_index_update_user_replica_set_from_sp(app, mocker):
    "Tests valid batch of ursm update actions"

    set_patches(mocker)

    tx_receipts = {
        "UpdateUserReplicaSet1Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "UserReplicaSet",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": "1,2,3:2,3,4",
                        "_signer": "spid2",
                    }
                )
            },
        ],
    }

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts[tx_receipt["transactionHash"].decode("utf-8")]

    mocker.patch(
        "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
        side_effect=get_events_side_effect,
        autospec=True,
    )

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        challenge_event_bus: ChallengeEventBus = setup_challenge_bus()
        eth_manager = EthManager(None, None, None)
        update_task = UpdateTask(web3, challenge_event_bus, None, eth_manager)

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    entities = {
        "users": [
            {
                "user_id": 1,
                "handle": "user-1",
                "wallet": "user1wallet",
                "primary_id": 1,
                "secondary_ids": [2, 3],
            }
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
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

    with db.scoped_session() as session:
        # validate db records
        all_users: List[User] = session.query(User).all()
        assert len(all_users) == 1

        user_1: User = (
            session.query(User)
            .filter(User.is_current == True, User.user_id == 1)
            .first()
        )
        assert user_1.primary_id == 2
        assert user_1.secondary_ids == [3, 4]


def test_index_update_user_replica_set(app, mocker):
    "Tests valid batch of ursm update actions"

    set_patches(mocker)

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts[tx_receipt["transactionHash"].decode("utf-8")]

    mocker.patch(
        "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
        side_effect=get_events_side_effect,
        autospec=True,
    )

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        challenge_event_bus: ChallengeEventBus = setup_challenge_bus()
        eth_manager = EthManager(None, None, None)
        update_task = UpdateTask(web3, challenge_event_bus, None, eth_manager)

    tx_receipts = {
        "UpdateUserReplicaSet1Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "UserReplicaSet",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": "1,2,3:2,3,4",
                        "_signer": "spid2",
                    }
                )
            },
        ],
    }

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    entities = {
        "users": [
            {
                "user_id": 1,
                "handle": "user-1",
                "wallet": "user1wallet",
                "primary_id": 1,
                "secondary_ids": [2, 3],
            }
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
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

    with db.scoped_session() as session:
        # validate db records
        all_users: List[User] = session.query(User).all()
        assert len(all_users) == 1

        user_1: User = (
            session.query(User)
            .filter(User.is_current == True, User.user_id == 1)
            .first()
        )
        assert user_1.primary_id == 2
        assert user_1.secondary_ids == [3, 4]
