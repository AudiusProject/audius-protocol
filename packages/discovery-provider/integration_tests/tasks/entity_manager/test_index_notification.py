from typing import List

from web3 import Web3
from web3.datastructures import AttributeDict

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import NotificationSeen
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.utils import Action, EntityType
from src.utils.db_session import get_db


def test_index_notification_view(app, mocker):
    "Tests notification view action"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, None)

    tx_receipts = {
        "NotificationRead1Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": EntityType.NOTIFICATION,
                        "_userId": 1,
                        "_action": Action.VIEW,
                        "_metadata": "QmCreatePlaylist1",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "NotificationRead2Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": EntityType.NOTIFICATION,
                        "_userId": 1,
                        "_action": Action.VIEW,
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "NotificationRead3Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": EntityType.NOTIFICATION,
                        "_userId": 2,
                        "_action": Action.VIEW,
                        "_metadata": "",
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "NotificationRead4Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 3,
                        "_entityType": EntityType.NOTIFICATION,
                        "_userId": 3,
                        "_action": Action.VIEW,
                        "_metadata": "",
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
            for user_id in range(1, 4)
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
        all_notification_seen: List[NotificationSeen] = session.query(
            NotificationSeen
        ).all()
        assert len(all_notification_seen) == 3
