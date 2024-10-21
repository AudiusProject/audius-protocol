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
from src.models.comments.comment_notification_setting import CommentNotificationSetting
from src.models.comments.comment_reaction import CommentReaction
from src.models.comments.comment_report import (
    COMMENT_REPORT_KARMA_THRESHOLD,
    CommentReport,
)
from src.models.comments.comment_thread import CommentThread
from src.models.moderation.muted_user import MutedUser
from src.models.notifications.notification import Notification
from src.models.tracks.track import Track
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)

entities = {
    "users": [
        {"user_id": 1, "wallet": "user1wallet"},
        {"user_id": 2, "wallet": "user2wallet"},
        {"user_id": 3, "wallet": "user3wallet"},
    ],
    "tracks": [{"track_id": 1, "owner_id": 1}],
}

comment_metadata = {
    "entity_id": 1,
    "entity_type": "Track",
    "body": "comment text",
    "parent_comment_id": None,
}

comment_json = json.dumps(comment_metadata)


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

    if isinstance(entities, list):
        for entity_set in entities:
            populate_mock_db(db, entity_set)
    else:
        populate_mock_db(db, entities)

    def index_transaction(session):
        return entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

    return db, index_transaction


def setup_test_without_mock(app, tx_receipts):
    # setup db and txs without mocking
    with app.app_context():
        db = get_db()
        web3 = Web3()
        challenge_event_bus: ChallengeEventBus = setup_challenge_bus()
        update_task = UpdateTask(web3, challenge_event_bus)

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    def index_transaction(session):
        return entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

    return db, index_transaction


def test_comment(app, mocker):
    """
    Tests that a user can post a comment and the track owner receives a notification.
    Track owner does not receive a notification if they are the comment author.
    """
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
            },
        ],
        "CreateComment2": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
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

    db, index_transaction = setup_test(app, mocker, entities, tx_receipts)

    with db.scoped_session() as session:
        index_transaction(session)

        comments: List[Comment] = session.query(Comment).all()
        assert len(comments) == 2

        comment_notifications = session.query(Notification).all()
        assert len(comment_notifications) == 1
        assert comment_notifications[0].type == "comment"
        assert comment_notifications[0].specifier == "2"
        assert comment_notifications[0].group_id == f"comment:{1}:type:Track"


def test_comment_reply(app, mocker):
    """
    Tests that a user can reply to a comment and the parent comment author receives a notification.
    Parent comment author does not receive a notification if they are the reply author.
    """
    reply_entities = {
        **entities,
        "comments": [{"comment_id": 1, "user_id": 2, "entity_id": 1}],
    }

    reply_comment_metadata = {
        **comment_metadata,
        "parent_comment_id": 1,
    }

    tx_receipts = {
        "CommentReply": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "Comment",
                        "_userId": 3,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "", "data": {json.dumps(reply_comment_metadata)}}}',
                        "_signer": "user3wallet",
                    }
                )
            },
        ],
        "CommentReply2": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 3,
                        "_entityType": "Comment",
                        "_userId": 2,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "", "data": {json.dumps(reply_comment_metadata)}}}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
    }

    db, index_transaction = setup_test(app, mocker, reply_entities, tx_receipts)

    with db.scoped_session() as session:
        index_transaction(session)

        assert len(session.query(Comment).all()) == 3
        comment_thread = session.query(CommentThread).all()
        assert len(comment_thread) == 2
        assert comment_thread[0].comment_id == 2
        assert comment_thread[0].parent_comment_id == 1

        # Assert parent comment user receives comment_thread notification
        thread_notifications = (
            session.query(Notification)
            .filter(Notification.type == "comment_thread")
            .all()
        )
        assert len(thread_notifications) == 1
        assert thread_notifications[0].specifier == "3"

        # Assert track owner does not receive comment notification from reply
        track_owner_notifications = (
            session.query(Notification).filter(Notification.type == "comment").all()
        )
        assert len(track_owner_notifications) == 0


def test_comment_mention(app, mocker):
    """
    Tests that users mentioned in a comment recieve a comment_mention notificatian.
    If the track owner is mentioned, they only receive a comment_mention notification.
    If a user is mentioned multiple times they only receive a single notification
    """

    mention_comment_metadata = {
        **comment_metadata,
        "body": "@user-1 @user-2 @user-3 comment text",
        "mentions": [1, 2, 3],
    }

    tx_receipts = {
        "CreateComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 3,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "", "data": {json.dumps(mention_comment_metadata)}}}',
                        "_signer": "user3wallet",
                    }
                )
            },
        ],
    }

    db, index_transaction = setup_test(app, mocker, entities, tx_receipts)

    with db.scoped_session() as session:
        index_transaction(session)

        assert len(session.query(Comment).all()) == 1
        assert len(session.query(CommentMention).all()) == 3

        # Assert track owner and user2 receive comment_mention notifications
        comment_mention_notifications = (
            session.query(Notification)
            .filter(Notification.type == "comment_mention")
            .all()
        )
        assert len(comment_mention_notifications) == 2
        assert comment_mention_notifications[0].user_ids == [1]
        assert comment_mention_notifications[1].user_ids == [2]

        # Assert track owner does not receive comment notification
        comment_notifications = (
            session.query(Notification).filter(Notification.type == "comment").all()
        )
        assert len(comment_notifications) == 0


def test_comment_mention_reply(app, mocker):
    """
    Test that a comment reply that mentions the parent comment user only sends them a reply notification
    """

    reply_entities = {
        **entities,
        "comments": [{"comment_id": 1, "user_id": 2, "entity_id": 1}],
    }

    mention_reply_comment_metadata = {
        **comment_metadata,
        "parent_comment_id": 1,
        "body": "@user-2 comment text",
        "mentions": [2],
    }

    tx_receipts = {
        "CreateComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "Comment",
                        "_userId": 3,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "", "data": {json.dumps(mention_reply_comment_metadata)}}}',
                        "_signer": "user3wallet",
                    }
                )
            },
        ],
    }

    db, index_transaction = setup_test(app, mocker, reply_entities, tx_receipts)

    with db.scoped_session() as session:
        index_transaction(session)

        assert (
            session.query(Notification)
            .filter(Notification.type == "comment_mention")
            .count()
            == 0
        )
        assert (
            session.query(Notification)
            .filter(Notification.type == "comment_thread")
            .count()
            == 1
        )


def test_edit_comment(app, mocker):
    """
    Tests editing a comment. Ensures comment text is updated an is 'edited'.
     Additional tests:
     - Mentioning a user that is not in the comment should work.
     - Mentioning a user that is already in the comment should work.
     - Unmentions a user, then rementions them should work.
    """

    edit_comment_entities = {
        **entities,
        "users": [*entities["users"], {"user_id": 4, "wallet": "user4wallet"}],
    }

    create_comment_metadata = {
        "entity_id": 1,
        "entity_type": "Track",
        "user_id": 1,
        "body": "@user-1 @user-2 comment text",
        "mentions": [1, 2],
    }

    update1_comment_metadata = {
        "entity_id": 1,
        "entity_type": "Track",
        "user_id": 1,
        "body": "@user-2 @user-3 @user-4 comment text",
        "mentions": [2, 3, 4],
    }

    update2_comment_metadata = {
        "entity_id": 1,
        "entity_type": "Track",
        "user_id": 1,
        "body": "@user-1 @user-2 @user-3 comment text",
        "mentions": [1, 2, 3],
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
        "Update1Comment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "", "data": {json.dumps(update1_comment_metadata)}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "Update2Comment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "", "data": {json.dumps(update2_comment_metadata)}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    db, index_transaction = setup_test(app, mocker, edit_comment_entities, tx_receipts)

    with db.scoped_session() as session:
        index_transaction(session)

        comments = session.query(Comment).all()
        assert len(comments) == 1
        assert comments[0].text == "@user-1 @user-2 @user-3 comment text"
        assert comments[0].is_edited == True

        comment_mentions = session.query(CommentMention).all()
        assert len(comment_mentions) == 4

        assert comment_mentions[0].is_delete == False
        assert comment_mentions[0].user_id == 1

        assert comment_mentions[1].is_delete == False
        assert comment_mentions[1].user_id == 2

        assert comment_mentions[2].is_delete == False
        assert comment_mentions[2].user_id == 3

        assert comment_mentions[3].is_delete == True
        assert comment_mentions[3].user_id == 4

        mention_notifications = (
            session.query(Notification)
            .filter(Notification.type == "comment_mention")
            .all()
        )
        assert len(mention_notifications) == 3
        assert mention_notifications[0].user_ids == [2]
        assert mention_notifications[1].user_ids == [3]
        # TODO ideally we can prevent this if it's in the same block
        assert mention_notifications[2].user_ids == [4]


def test_pin_comment(app, mocker):
    "Test track owner can pin a comment, and existing pinned comment is unpinned"

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

    db, index_transaction = setup_test(app, mocker, entities, tx_receipts)

    with db.scoped_session() as session:
        index_transaction(session)

        tracks = session.query(Track).filter(Track.track_id == 1).all()
        assert tracks[0].pinned_comment_id == 1


def test_unpin_comment(app, mocker):
    unpin_entities = {
        **entities,
        "tracks": [{**entities["tracks"][0], "pinned_comment_id": 1}],
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
                        "_action": "Unpin",
                        "_metadata": f'{{"cid": "", "data": {json.dumps({"entity_id": 1})}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    db, index_transaction = setup_test(app, mocker, unpin_entities, tx_receipts)

    with db.scoped_session() as session:
        index_transaction(session)

        tracks = session.query(Track).filter(Track.track_id == 1).all()
        assert len(tracks) == 1
        assert tracks[0].pinned_comment_id == None


def test_pin_comment_validation(app, mocker):
    """
    Test that a user cannot pin a comment that doesn't exist
    Test that a user cannot pin a comment that is already pinned
    """

    test_entities = {
        **entities,
        "comments": [{"comment_id": 1, "user_id": 1}],
    }

    tx_receipts = {
        "PinCommentMissingComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "Pin",
                        "_metadata": f'{{"cid": "", "data": {json.dumps({"entity_id": 1})}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
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

    db, index_transaction = setup_test(app, mocker, test_entities, tx_receipts)

    with db.scoped_session() as session:
        index_transaction(session)

        # Assert correct pinned comment and no blow-up from missing comment or dupe
        tracks = session.query(Track).filter(Track.track_id == 1).all()
        assert tracks[0].pinned_comment_id == 1


def test_report_comment(app, mocker):
    "Tests users can report a comment"

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

    db, index_transaction = setup_test(app, mocker, entities, tx_receipts)

    with db.scoped_session() as session:
        # index transactions
        index_transaction(session)

        # validate db records
        all_reported_comments: List[CommentReport] = session.query(CommentReport).all()
        assert len(all_reported_comments) == 1
        assert all_reported_comments[0].comment_id == 1
        assert all_reported_comments[0].user_id == 1


def test_mute_track_comments(app, mocker):
    "Tests comment notifications are not sent when track is muted"

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
    }

    db, index_transaction = setup_test(app, mocker, entities, tx_receipts)

    with db.scoped_session() as session:
        index_transaction(session)

        comment_notification_settings = (
            session.query(CommentNotificationSetting)
            .filter_by(entity_id=1, entity_type="Track", user_id=1)
            .first()
        )

        assert comment_notification_settings.is_muted == True


def test_unmute_track_comments(app, mocker):
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
    }

    db, index_transaction = setup_test(app, mocker, entities, tx_receipts)

    with db.scoped_session() as session:
        # index transactions
        index_transaction(session)

        comment_notification_settings = (
            session.query(CommentNotificationSetting)
            .filter_by(entity_id=1, entity_type="Track", user_id=1)
            .first()
        )

        assert comment_notification_settings.is_muted == False


def test_mute_comment_thread(app, mocker):
    "Tests comment reply notifications are not sent when comment is muted"

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
    }

    db, index_transaction = setup_test(app, mocker, entities, tx_receipts)

    with db.scoped_session() as session:
        index_transaction(session)

        comment_notification_settings = (
            session.query(CommentNotificationSetting)
            .filter_by(entity_id=1, entity_type="Comment", user_id=1)
            .first()
        )

        assert comment_notification_settings.is_muted == True


def test_unmute_comment_thread(app, mocker):
    "Tests comment notifications are sent when comment is unmuted"

    unmute_entities = {
        **entities,
        "comments": [
            {
                "comment_id": 1,
                "user_id": 1,
            }
        ],
        "comment_notification_settings": [
            {
                "entitity_id": 1,
                "entity_type": "Comment",
                "user_id": 1,
                "is_muted": True,
            },
        ],
    }

    tx_receipts = {
        "UnMuteComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "Unmute",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            }
        ],
    }

    db, index_transaction = setup_test(app, mocker, unmute_entities, tx_receipts)

    with db.scoped_session() as session:
        # index transactions
        index_transaction(session)

        comment_notification_settings = (
            session.query(CommentNotificationSetting)
            .filter_by(entity_id=1, entity_type="Comment", user_id=1)
            .first()
        )

        assert comment_notification_settings.is_muted == False


def test_mute_user(app, mocker):
    "Tests comment notifications are not sent when user is muted"

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
            }
        ],
    }

    db, index_transaction = setup_test(app, mocker, entities, tx_receipts)

    with db.scoped_session() as session:
        index_transaction(session)

        muted_users = (
            session.query(MutedUser).filter_by(muted_user_id=2, user_id=1).first()
        )

        assert muted_users.is_delete == False


def test_unmute_user(app, mocker):
    "Tests comment notifications are not sent when user is muted"

    unmute_entities = {
        **entities,
        "muted_users": [
            {
                "muted_user_id": 2,
                "user_id": 1,
            },
        ],
    }

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

    db, index_transaction = setup_test(app, mocker, unmute_entities, tx_receipts)

    with db.scoped_session() as session:
        index_transaction(session)

        muted_users = (
            session.query(MutedUser).filter_by(muted_user_id=2, user_id=1).first()
        )

        assert muted_users.is_delete == True


def test_dupe_comment_create(app, mocker):
    "Tests duplicate comment create txs are ignored"

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

    db, index_transaction = setup_test(app, mocker, entities, tx_receipts)

    with db.scoped_session() as session:
        index_transaction(session)

        all_comments: List[Comment] = session.query(Comment).all()
        assert len(all_comments) == 1


def test_dupe_comment_react(app, mocker):
    "Tests duplicate comment react txs are ignored"

    entities = {
        "users": [
            {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
        ],
        "comments": [{"comment_id": 1}],
        "tracks": [{"track_id": 1, "owner_id": 1}],
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

    db, index_transaction = setup_test(app, mocker, entities, tx_receipts)

    with db.scoped_session() as session:
        index_transaction(session)

        all_reactions: List[CommentReaction] = session.query(CommentReaction).all()
        assert len(all_reactions) == 1


def test_mute_track_comment_notifications(app, mocker):
    "Track owner receives no comment, reply, or mention notifications when muted"

    mute_track_entities = {
        **entities,
        "comment_notification_settings": [
            {
                "entity_id": 1,
                "entity_type": "Track",
                "user_id": 1,
                "is_muted": True,
            },
        ],
    }

    reply_comment_metadata = {
        **comment_metadata,
        "body": "reply to comment",
        "parent_comment_id": 2,
    }

    mention_comment_metadata = {
        **comment_metadata,
        "body": "@user-1",
        "mentions": [1],
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
            },
        ],
        "OwnerCreateComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "Comment",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "", "data": {comment_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "ReplyComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 3,
                        "_entityType": "Comment",
                        "_userId": 3,
                        "_action": "Reply",
                        "_metadata": f'{{"cid": "", "data": {json.dumps(reply_comment_metadata)}}}',
                        "_signer": "user3wallet",
                    }
                )
            },
        ],
        "CreateCommentMention": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 4,
                        "_entityType": "Comment",
                        "_userId": 3,
                        "_action": "Mention",
                        "_metadata": f'{{"cid": "", "data": {json.dumps(mention_comment_metadata)}}}',
                        "_signer": "user3wallet",
                    }
                )
            },
        ],
    }

    db, index_transaction = setup_test(app, mocker, mute_track_entities, tx_receipts)

    with db.scoped_session() as session:
        index_transaction(session)

        notifications = session.query(Notification).all()

        assert len(notifications) == 0


def test_mute_comment_thread_notifications(app, mocker):
    "Comment thread owner receives no comment, reply, or mention notifications when muted"

    mute_comment_thread_entities = {
        **entities,
        "comments": [{"comment_id": 1, "owner_id": 2}],
        "comment_notification_settings": [
            {
                "entity_id": 1,
                "entity_type": "CommentThread",
                "user_id": 2,
                "is_muted": True,
            },
        ],
    }

    reply_comment_metadata = {
        **comment_metadata,
        "body": "reply to comment",
        "parent_comment_id": 2,
    }

    tx_receipts = {
        "ReplyComment": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 3,
                        "_entityType": "Comment",
                        "_userId": 3,
                        "_action": "Reply",
                        "_metadata": f'{{"cid": "", "data": {json.dumps(reply_comment_metadata)}}}',
                        "_signer": "user3wallet",
                    }
                )
            },
        ],
    }

    db, index_transaction = setup_test(
        app, mocker, mute_comment_thread_entities, tx_receipts
    )

    with db.scoped_session() as session:
        index_transaction(session)

        notifications = session.query(Notification).all()

        assert len(notifications) == 0


def test_mute_user_notifications(app, mocker):
    "User receives no comment, reply, or mention notifications when muted"

    mute_user_entities = {
        **entities,
        "muted_users": [
            {
                "muted_user_id": 2,
                "user_id": 1,
            },
            {
                "muted_user_id": 3,
                "user_id": 1,
            },
        ],
    }

    mention_comment_metadata = {
        **comment_metadata,
        "body": "@user-1",
        "mentions": [1],
    }

    print("dyllann", mention_comment_metadata)

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
            },
        ],
        "CommentMention": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "Comment",
                        "_userId": 3,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "", "data": {json.dumps(mention_comment_metadata)}}}',
                        "_signer": "user3wallet",
                    }
                )
            },
        ],
    }

    db, index_transaction = setup_test(app, mocker, mute_user_entities, tx_receipts)

    with db.scoped_session() as session:
        index_transaction(session)

        notifications = session.query(Notification).all()

        assert len(notifications) == 0


def test_reported_comment_notifications(app, mocker):
    """
    A few tests around user reports and notifications
    - When a user reports a comment, they do not receive notifications for that comment
    - When the track owner reports a comment, no one receives any notifications for that comment
    - When enough users report a comment, no one receives any notifications for that comment
    """

    # This needs to be set before user4 to prevent sql errors
    initial_entities = {
        "aggregate_user": [
            {"user_id": 4, "follower_count": COMMENT_REPORT_KARMA_THRESHOLD},
        ]
    }

    mute_user_entities = {
        **entities,
        "comments": [
            {"comment_id": 1, "owner_id": 2},
            {"comment_id": 2, "owner_id": 4},
            {"comment_id": 3, "owner_id": 3},
        ],
        "comment_reports": [
            {
                "comment_id": 1,
                "user_id": 3,
            },
            {
                "comment_id": 2,
                "user_id": 1,
            },
            {
                "comment_id": 3,
                "user_id": 4,
            },
        ],
        "users": [*entities["users"], {"user_id": 4, "wallet": "user4wallet"}],
    }

    comment_1_edit_metadata = {
        **comment_metadata,
        "body": "@user-3",
        "mentions": [3],
    }

    comment_2_edit_metadata = {
        **comment_metadata,
        "body": "@user-1 @user-3, @user-4",
        "mentions": [1, 2, 3],
    }

    comment_3_edit_metadata = {
        **comment_metadata,
        "body": "@user-1 @user-2 @user-3",
        "mentions": [1, 2, 4],
    }

    tx_receipts = {
        "EditComment1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Comment",
                        "_userId": 2,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "", "data": {json.dumps(comment_1_edit_metadata)}}}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "EditComment2": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "Comment",
                        "_userId": 4,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "", "data": {json.dumps(comment_2_edit_metadata)}}}',
                        "_signer": "user4wallet",
                    }
                )
            },
        ],
        "EditComment3": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 3,
                        "_entityType": "Comment",
                        "_userId": 3,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "", "data": {json.dumps(comment_3_edit_metadata)}}}',
                        "_signer": "user3wallet",
                    }
                )
            },
        ],
    }

    db, index_transaction = setup_test(
        app, mocker, [initial_entities, mute_user_entities], tx_receipts
    )

    with db.scoped_session() as session:
        index_transaction(session)

        notifications = session.query(Notification).all()

        assert len(notifications) == 0
