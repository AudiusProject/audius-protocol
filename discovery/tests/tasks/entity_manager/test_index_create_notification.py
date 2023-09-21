import logging  # pylint: disable=C0302
from typing import List

from web3 import Web3
from web3.datastructures import AttributeDict

from src.challenges.challenge_event_bus import ChallengeEventBus, setup_challenge_bus
from src.models.notifications.notification import Notification
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.utils.db_session import get_db
from tests.challenges.index_helpers import UpdateTask
from tests.utils import populate_mock_db

logger = logging.getLogger(__name__)


def set_patches(mocker):
    mocker.patch(
        "src.tasks.entity_manager.entities.notification.get_verifier_address",
        return_value="0x",
        autospec=True,
    )


def test_index_create_notification(app, mocker):
    "Tests valid notification creations"
    set_patches(mocker)

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        challenge_event_bus: ChallengeEventBus = setup_challenge_bus()
        update_task = UpdateTask(web3, challenge_event_bus)

    tx_receipts = {
        "CreateNotification1Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Notification",
                        "_userId": 0,
                        "_action": "Create",
                        "_metadata": '{"userGroup":"all", "title":"Happy Halloween","description":"use audius now!"}',
                        "_signer": "0x",
                    }
                )
            },
        ]
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

    entities = {"users": [{"user_id": i} for i in range(1, 121)]}
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=20,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

        notifications: List[Notification] = session.query(Notification).all()
        assert len(notifications) == 1

        announcement_notification = notifications[0]
        assert announcement_notification.type == "announcement"
        assert announcement_notification.group_id == "announcement:blocknumber:20"
        # test is modified to not return any users because it can break discprov, see .all()
        assert announcement_notification.user_ids == []  # list(range(1, 121))
        assert announcement_notification.data == {
            "userGroup": "all",
            "title": "Happy Halloween",
            "description": "use audius now!",
        }
