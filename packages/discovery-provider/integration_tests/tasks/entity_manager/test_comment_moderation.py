import json
import logging  # pylint: disable=C0302
from typing import List

from web3 import Web3
from web3.datastructures import AttributeDict

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.challenges.challenge_event_bus import ChallengeEventBus, setup_challenge_bus
from src.models.moderation.muted_user import MutedUser
from src.models.moderation.reported_comment import ReportedComment
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


def test_artist_mute_user(app, mocker):
    "Tests artist can mute a user"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        challenge_event_bus: ChallengeEventBus = setup_challenge_bus()
        update_task = UpdateTask(web3, challenge_event_bus)

    tx_receipts = {
        "MuteUser": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "User",
                        "_userId": 1,
                        "_action": "Mute",
                        "_metadata": "",
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

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts[tx_receipt["transactionHash"].decode("utf-8")]

    mocker.patch(
        "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
        side_effect=get_events_side_effect,
        autospec=True,
    )

    entities = {
        "users": [
            {"user_id": 1, "handle": "artist", "wallet": "user1wallet"},
            {"user_id": 2, "handle": "punisher", "wallet": "user2wallet"},
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
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

        # validate db records
        all_muted_users: List[MutedUser] = session.query(MutedUser).all()
        assert len(all_muted_users) == 1
        assert all_muted_users[0].muted_user_id == 2
        assert all_muted_users[0].user_id == 1
        assert all_muted_users[0].is_delete == False


def test_artist_unmute_user(app, mocker):
    "Tests artist can unmute a user"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        challenge_event_bus: ChallengeEventBus = setup_challenge_bus()
        update_task = UpdateTask(web3, challenge_event_bus)

    tx_receipts = {
        "MuteUser": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "User",
                        "_userId": 1,
                        "_action": "Mute",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "UnmuteUser": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "User",
                        "_userId": 1,
                        "_action": "Unmute",
                        "_metadata": "",
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

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts[tx_receipt["transactionHash"].decode("utf-8")]

    mocker.patch(
        "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
        side_effect=get_events_side_effect,
        autospec=True,
    )

    entities = {
        "users": [
            {"user_id": 1, "handle": "artist", "wallet": "user1wallet"},
            {"user_id": 2, "handle": "punisher", "wallet": "user2wallet"},
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
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

        # validate db records
        all_muted_users: List[MutedUser] = session.query(MutedUser).all()
        assert len(all_muted_users) == 1
        assert all_muted_users[0].muted_user_id == 2
        assert all_muted_users[0].user_id == 1
        assert all_muted_users[0].is_delete == True


def test_report_comment(app, mocker):
    "Tests users can report a comment"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        challenge_event_bus: ChallengeEventBus = setup_challenge_bus()
        update_task = UpdateTask(web3, challenge_event_bus)

    tx_receipts = {
        "ReportComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "Report",
                        "_metadata": "",
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

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts[tx_receipt["transactionHash"].decode("utf-8")]

    mocker.patch(
        "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
        side_effect=get_events_side_effect,
        autospec=True,
    )

    entities = {
        "users": [
            {"user_id": 1, "handle": "artist", "wallet": "user1wallet"},
        ],
        "comments": [{"comment_id": 1}],
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

        # validate db records
        all_reported_comments: List[ReportedComment] = session.query(
            ReportedComment
        ).all()
        assert len(all_reported_comments) == 1
        assert all_reported_comments[0].reported_comment_id == 1
        assert all_reported_comments[0].user_id == 1
