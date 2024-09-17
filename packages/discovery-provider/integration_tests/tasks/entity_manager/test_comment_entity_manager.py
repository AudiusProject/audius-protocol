import json
import logging  # pylint: disable=C0302
from typing import List

from web3 import Web3
from web3.datastructures import AttributeDict

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.challenges.challenge_event_bus import ChallengeEventBus, setup_challenge_bus
from src.models.comments.comment import Comment
from src.models.comments.comment_reaction import CommentReaction
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)

default_metadata = {
    "entity_id": 1,
    "entity_type": "Track",
    "body": "comment text",
    "parent_comment_id": None,
}

comment_json = json.dumps(default_metadata)


def setup_test(app, mocker, entities, tx_receipts):
    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        challenge_event_bus: ChallengeEventBus = setup_challenge_bus()
        update_task = UpdateTask(web3, challenge_event_bus)

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

    populate_mock_db(db, entities)

    return entity_manager_txs, db, update_task


def test_dupe_comment_create(app, mocker):
    "Tests duplicate comment create txs are ignored"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        challenge_event_bus: ChallengeEventBus = setup_challenge_bus()
        update_task = UpdateTask(web3, challenge_event_bus)

    create_comment_json = json.dumps(default_metadata)
    tx_receipts = {
        "CreateComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "", "data": {create_comment_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateCommentDupe": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "", "data": {create_comment_json}}}',
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
            {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
        ],
        "tracks": [
            {
                "track_id": 1,
                "owner_id": 1,
            },
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
        all_comments: List[Comment] = session.query(Comment).all()
        assert len(all_comments) == 1


def test_dupe_comment_react(app, mocker):
    "Tests duplicate comment create txs are ignored"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        challenge_event_bus: ChallengeEventBus = setup_challenge_bus()
        update_task = UpdateTask(web3, challenge_event_bus)

    tx_receipts = {
        "CreateCommentReact": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "React",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateCommentReactDupe": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "React",
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
            {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
        ],
        "comments": [{"comment_id": 1}],
        "tracks": [
            {
                "track_id": 1,
                "owner_id": 1,
            },
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
        all_reactions: List[CommentReaction] = session.query(CommentReaction).all()
        assert len(all_reactions) == 1


def test_comment_pin(app, mocker):

    entities = {
        "users": [
            {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
            {"user_id": 2, "handle": "user-2", "wallet": "user2wallet"},
        ],
        "tracks": [
            {
                "track_id": 1,
                "owner_id": 1,
            },
        ],
        "comments": [{"comment_id": 1, "user_id": 2}],
    }

    tx_receipts = {
        "PinComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "Pin",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs, db, update_task = setup_test(app, mocker, entities, tx_receipts)

    with db.scoped_session() as session:
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

        comments = session.query(Comment).all()
        assert comments[0].is_pinned == True


def test_comment_unpin(app, mocker):
    entities = {
        "users": [
            {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
            {"user_id": 2, "handle": "user-2", "wallet": "user2wallet"},
        ],
        "tracks": [{"track_id": 1, "owner_id": 1}],
        "comments": [{"comment_id": 1, "user_id": 2, "is_pinned": True}],
    }

    tx_receipts = {
        "PinComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "Unpin",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs, db, update_task = setup_test(app, mocker, entities, tx_receipts)

    with db.scoped_session() as session:
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

        comments = session.query(Comment).all()
        assert comments[0].is_pinned == False


def test_dupe_pin(app, mocker):
    entities = {
        "users": [
            {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
        ],
        "tracks": [
            {"track_id": 1, "owner_id": 1},
        ],
        "comments": [{"comment_id": 1, "user_id": 1}],
    }

    tx_receipts = {
        "PinComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "Pin",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "PinCommentDupe": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "Pin",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs, db, update_task = setup_test(app, mocker, entities, tx_receipts)

    with db.scoped_session() as session:
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

        comments = session.query(Comment).all()
        # Assert first pin
        assert comments[0].is_pinned == True


def test_pin_missing_comment(app, mocker):
    entities = {
        "users": [
            {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
        ],
        "tracks": [
            {"track_id": 1, "owner_id": 1},
        ],
    }

    tx_receipts = {
        "PinComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "Pin",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "PinCommentDupe": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "Pin",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs, db, update_task = setup_test(app, mocker, entities, tx_receipts)

    with db.scoped_session() as session:
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

        comments = session.query(Comment).all()
        # Assert no comments and no blow-up
        assert len(comments) == 0
