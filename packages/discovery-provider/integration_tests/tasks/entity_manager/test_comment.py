import json
import logging  # pylint: disable=C0302
from typing import List

from web3 import Web3
from web3.datastructures import AttributeDict

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.challenges.challenge_event_bus import ChallengeEventBus, setup_challenge_bus
from src.models.comments.comment import Comment
from src.models.comments.comment_mention import CommentMention
from src.models.comments.comment_reaction import CommentReaction
from src.models.comments.comment_report import CommentReport
from src.models.comments.comment_thread import CommentThread
from src.models.notifications.notification import Notification
from src.models.tracks.track import Track
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

    tx_receipts = {
        "CreateComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "", "data": {comment_json}}}',
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
                        "_metadata": f'{{"cid": "", "data": {comment_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs, db, update_task = setup_test(app, mocker, entities, tx_receipts)

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

    entity_manager_txs, db, update_task = setup_test(app, mocker, entities, tx_receipts)

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
    "Test track owner can pin a comment, and existing comment pinned comment is unpinned"

    entities = {
        "users": [
            {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
            {"user_id": 2, "handle": "user-2", "wallet": "user2wallet"},
        ],
        "tracks": [{"track_id": 1, "owner_id": 1, "pinned_comment_id": 2}],
        "comments": [{"comment_id": 1, "user_id": 2}, {"comment_id": 2, "user_id": 2}],
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
                        "_metadata": f'{{"cid": "", "data": {json.dumps({"entity_id": 1})}}}',
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

        tracks = session.query(Track).filter(Track.track_id == 1).all()
        assert tracks[0].pinned_comment_id == 1


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
                        "_metadata": f'{{"cid": "", "data": {json.dumps({"entity_id": 1})}}}',
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

        tracks = session.query(Track).filter(Track.track_id == 1).all()
        assert tracks[0].pinned_comment_id == None


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
                        "_metadata": f'{{"cid": "", "data": {json.dumps({"entity_id": 1})}}}',
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
                        "_metadata": f'{{"cid": "", "data": {json.dumps({"entity_id": 1})}}}',
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

        tracks = session.query(Track).filter(Track.track_id == 1).all()
        assert tracks[0].pinned_comment_id == 1


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
                        "_metadata": f'{{"cid": "", "data": {json.dumps({"entity_id": 1})}}}',
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
                        "_metadata": f'{{"cid": "", "data": {json.dumps({"entity_id": 1})}}}',
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


def test_report_comment(app, mocker):
    "Tests users can report a comment"

    entities = {
        "users": [
            {"user_id": 1, "handle": "artist", "wallet": "user1wallet"},
        ],
        "comments": [{"comment_id": 1}],
    }

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

    entity_manager_txs, db, update_task = setup_test(app, mocker, entities, tx_receipts)

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
        all_reported_comments: List[CommentReport] = session.query(CommentReport).all()
        assert len(all_reported_comments) == 1
        assert all_reported_comments[0].comment_id == 1
        assert all_reported_comments[0].user_id == 1


def test_comment_mention(app, mocker):
    "Tests comment mentions are saved to the database"

    mention_metadata = {
        "entity_id": 1,
        "entity_type": "Track",
        "user_id": 1,
        "body": "@user-1 comment text",
        "mentions": [1],
        "parent_comment_id": None,
    }

    comment_json = json.dumps(mention_metadata)

    entities = {
        "users": [
            {"user_id": 1, "handle": "artist", "wallet": "user1wallet"},
        ],
    }

    tx_receipts = {
        "CreateComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "", "data": {comment_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs, db, update_task = setup_test(app, mocker, entities, tx_receipts)

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
        comments = session.query(Comment).all()
        comment_mentions = session.query(CommentMention).all()
        assert len(comments) == 1
        assert len(comment_mentions) == 1


def test_comment_mentions(app, mocker):
    "Tests comment mentions are saved to the database"

    create_comment_metadata = {
        "entity_id": 1,
        "entity_type": "Track",
        "user_id": 1,
        "body": "@user-1 comment text",
        "mentions": [1, 2],
    }

    update_comment_metadata = {
        "entity_id": 1,
        "entity_type": "Track",
        "user_id": 1,
        "body": "@user-2 comment text",
        "mentions": [2, 3],
    }

    entities = {
        "users": [
            {"user_id": 1, "handle": "artist1", "wallet": "user1wallet"},
            {"user_id": 2, "handle": "artist2", "wallet": "user2wallet"},
            {"user_id": 3, "handle": "artist3", "wallet": "user3wallet"},
        ],
    }

    tx_receipts = {
        "CreateComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "", "data": {json.dumps(create_comment_metadata)}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "UpdateComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "", "data": {json.dumps(update_comment_metadata)}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs, db, update_task = setup_test(app, mocker, entities, tx_receipts)

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
        comments = session.query(Comment).all()
        assert len(comments) == 1
        assert comments[0].text == "@user-2 comment text"
        assert comments[0].is_edited == True

        comment_mentions = session.query(CommentMention).all()
        assert len(comment_mentions) == 3

        assert comment_mentions[0].is_delete == True
        assert comment_mentions[0].user_id == 1

        assert comment_mentions[1].is_delete == False
        assert comment_mentions[1].user_id == 2

        assert comment_mentions[2].is_delete == False
        assert comment_mentions[2].user_id == 3


def test_comment_threads(app, mocker):
    "Tests threads are saved to db"

    reply_comment_metadata = {
        "entity_id": 1,
        "entity_type": "Track",
        "user_id": 1,
        "body": "reply comment text",
        "parent_comment_id": 1,
    }

    entities = {
        "users": [
            {"user_id": 1, "handle": "artist1", "wallet": "user1wallet"},
            {"user_id": 2, "handle": "artist2", "wallet": "user2wallet"},
        ],
        "tracks": [
            {"track_id": 1, "owner_id": 1},
        ],
    }

    tx_receipts = {
        "CreateComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 2,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "", "data": {comment_json}}}',
                        "_signer": "user2wallet",
                    }
                )
            }
        ],
        "ReplyComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "", "data": {json.dumps(reply_comment_metadata)}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs, db, update_task = setup_test(app, mocker, entities, tx_receipts)

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
        comments = session.query(Comment).all()
        assert len(comments) == 2
        assert comments[1].text == "reply comment text"

        comment_threads = session.query(CommentThread).all()
        assert len(comment_threads) == 1
        assert comment_threads[0].parent_comment_id == 1
        assert comment_threads[0].comment_id == 2

        comment_notifications = session.query(Notification).all()
        assert len(comment_notifications) == 2
        assert comment_notifications[0].type == "comment"
        assert comment_notifications[1].type == "comment_thread"


def test_mute_track_notifications(app, mocker):
    "Tests comment notifications are not sent when track is muted"

    entities = {
        "users": [
            {"user_id": 1, "handle": "artist1", "wallet": "user1wallet"},
            {"user_id": 2, "handle": "artist2", "wallet": "user2wallet"},
        ],
        "tracks": [
            {"track_id": 1, "owner_id": 1},
        ],
    }

    tx_receipts = {
        "MuteTrackComments": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Mute",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            }
        ],
        "CreateComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 2,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "", "data": {comment_json}}}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs, db, update_task = setup_test(app, mocker, entities, tx_receipts)

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
        comments = session.query(Comment).all()
        assert len(comments) == 1

        comment_notifications = session.query(Notification).all()
        assert len(comment_notifications) == 0


def test_unmute_track_notifications(app, mocker):
    "Tests comment notifications are sent when track is unmuted"

    entities = {
        "users": [
            {"user_id": 1, "handle": "artist1", "wallet": "user1wallet"},
            {"user_id": 2, "handle": "artist2", "wallet": "user2wallet"},
        ],
        "tracks": [
            {"track_id": 1, "owner_id": 1},
        ],
        "comment_notification_settings": [
            {"entity_id": 1, "entity_type": "Track", "user_id": 1, "is_muted": True},
        ],
    }

    tx_receipts = {
        "UnMuteTrackComments": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Unmute",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            }
        ],
        "CreateComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 2,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "", "data": {comment_json}}}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs, db, update_task = setup_test(app, mocker, entities, tx_receipts)

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
        comment_notifications = session.query(Notification).all()
        assert len(comment_notifications) == 1


def test_mute_comment_notifications(app, mocker):
    "Tests comment reply notifications are not sent when comment is muted"

    entities = {
        "users": [
            {"user_id": 1, "handle": "artist1", "wallet": "user1wallet"},
            {"user_id": 2, "handle": "artist2", "wallet": "user2wallet"},
        ],
        "comments": [{"comment_id": 1, "user_id": 1}],
        "tracks": [
            {"track_id": 1, "owner_id": 1},
        ],
    }

    tx_receipts = {
        "MuteTrackComments": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "Mute",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            }
        ],
        "CreateComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "Comment",
                        "_userId": 2,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "", "data": {json.dumps({"entity_id": 2, "entity_type": "Track", "body": "comment text", "parent_comment_id": 1})}}}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs, db, update_task = setup_test(app, mocker, entities, tx_receipts)

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
        comments = session.query(Comment).all()
        assert len(comments) == 2

        comment_notifications = session.query(Notification).all()
        assert len(comment_notifications) == 0


def test_unmute_comment_notifications(app, mocker):
    "Tests comment notifications are sent when track is unmuted"

    entities = {
        "users": [
            {"user_id": 1, "handle": "artist1", "wallet": "user1wallet"},
            {"user_id": 2, "handle": "artist2", "wallet": "user2wallet"},
        ],
        "tracks": [
            {"track_id": 1, "owner_id": 1},
        ],
        "comment_notification_settings": [
            {
                "entitity_id": 1,
                "entity_type": "Comment",
                "user_id": 2,
                "is_muted": True,
            },
        ],
    }

    tx_receipts = {
        "UnMuteTrackComments": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Unmute",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            }
        ],
        "CreateComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 2,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "", "data": {comment_json}}}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs, db, update_task = setup_test(app, mocker, entities, tx_receipts)

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
        comment_notifications = session.query(Notification).all()
        assert len(comment_notifications) == 1
