import json
import logging
from typing import List
from unittest import mock

from web3 import Web3
from web3.datastructures import AttributeDict

from src.challenges.challenge_event import ChallengeEvent
from src.models.notifications.milestone import Milestone
from src.models.notifications.notification import Notification
from src.models.playlists.aggregate_playlist import AggregatePlaylist
from src.models.playlists.playlist import Playlist
from src.models.social.follow import Follow
from src.models.social.repost import Repost
from src.models.social.save import Save
from src.models.social.subscription import Subscription
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.utils import EntityType
from src.utils.db_session import get_db
from tests.challenges.index_helpers import UpdateTask
from tests.utils import populate_mock_db

logger = logging.getLogger(__name__)


def test_index_valid_social_features(app, mocker):
    "Tests valid batch of social create/update/delete actions"
    bus_mock = mocker.patch(
        "src.challenges.challenge_event_bus.ChallengeEventBus", autospec=True
    )

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, challenge_event_bus=bus_mock)

    """
    const resp = await this.manageEntity({
        userId,
        entityType: EntityType.USER,
        entityId: followeeUserId,
        action: isUnfollow ? Action.UNFOLLOW : Action.FOLLOW,
        metadataMultihash: ''
      })
    """
    tx_receipts = {
        "FollowUserTx1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "User",
                        "_userId": 1,
                        "_action": "Follow",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "UnfollowUserTx2": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 3,
                        "_entityType": "User",
                        "_userId": 1,
                        "_action": "Unfollow",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "SubscribeUserTx1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "User",
                        "_userId": 3,
                        "_action": "Subscribe",
                        "_metadata": "",
                        "_signer": "user3wallet",
                    }
                )
            },
        ],
        "UnsubscribeUserTx2": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "User",
                        "_userId": 3,
                        "_action": "Unsubscribe",
                        "_metadata": "",
                        "_signer": "user3wallet",
                    }
                )
            },
        ],
        "SaveTrackTx3": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Save",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "SaveTrackTx3Dupe": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Save",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "UnsaveTrackTx3": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Unsave",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        # Delegated social action
        "SaveTrackTx4": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Track",
                        "_userId": 2,
                        "_action": "Save",
                        "_metadata": "",
                        "_signer": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4C4",
                    }
                )
            },
        ],
        "UnrepostPlaylistTx3": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Unrepost",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "RepostPlaylistTx4": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Repost",
                        "_metadata": '{"is_repost_of_repost": true}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "RepostPlaylistTx5": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Playlist",
                        "_userId": 3,
                        "_action": "Repost",
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
            {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
            {"user_id": 2, "handle": "user-2", "wallet": "user2wallet"},
            {"user_id": 3, "handle": "user-3", "wallet": "user3wallet"},
        ],
        "playlists": [{"playlist_id": 1, "playlist_owner_id": 11}],
        "tracks": [{"track_id": 1, "owner_id": 11}],
        "developer_apps": [
            {
                "user_id": 1,
                "name": "My App",
                "address": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4C4",
            },
        ],
        "grants": [
            {
                "user_id": 2,
                "grantee_address": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4C4",
            }
        ],
    }

    test_social_feature_entities = {
        "reposts": [{"repost_item_id": 1, "repost_type": "playlist", "user_id": 1}],
        "subscriptions": [{"subscriber_id": 3, "user_id": 2}],
        "follows": [{"follower_user_id": 1, "followee_user_id": 3}],
    }

    populate_mock_db(db, entities)
    populate_mock_db(db, test_social_feature_entities)

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=1,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

        # Verify follows
        all_follows: List[Follow] = session.query(Follow).all()
        assert len(all_follows) == 2

        user_3_follows: List[Follow] = (
            session.query(Follow)
            .filter(Follow.is_current == True, Follow.followee_user_id == 3)
            .all()
        )
        assert len(user_3_follows) == 1
        user_3_follow = user_3_follows[0]
        assert user_3_follow.is_delete == True

        user_2_follows: List[Follow] = (
            session.query(Follow)
            .filter(Follow.is_current == True, Follow.followee_user_id == 2)
            .all()
        )
        assert len(user_2_follows) == 1
        user_2_follow = user_2_follows[0]
        assert user_2_follow.is_delete == False

        # Verify subscriptions
        all_subscriptions: List[Subscription] = session.query(Subscription).all()
        assert len(all_subscriptions) == 4

        user_1_subscribers: List[Subscription] = (
            session.query(Subscription)
            .filter(Subscription.is_current == True, Subscription.user_id == 1)
            .all()
        )
        assert len(user_1_subscribers) == 1
        user_1_subscriber = user_1_subscribers[0]
        assert user_1_subscriber.subscriber_id == 3
        assert user_1_subscriber.is_delete == False

        user_2_subscribers: List[Subscription] = (
            session.query(Subscription)
            .filter(Subscription.is_current == True, Subscription.user_id == 2)
            .all()
        )
        assert len(user_2_subscribers) == 2
        subscriber_ids = map(
            lambda subscription: subscription.subscriber_id, user_2_subscribers
        )
        # Automatic subscribe on follow
        assert 1 in subscriber_ids
        assert 3 in subscriber_ids
        user_2_subscriber_1 = list(
            filter(
                lambda subscription: subscription.subscriber_id == 1, user_2_subscribers
            )
        )[0]
        assert user_2_subscriber_1.subscriber_id == 1
        assert user_2_subscriber_1.is_delete == False
        user_2_subscriber_3 = list(
            filter(
                lambda subscription: subscription.subscriber_id == 3, user_2_subscribers
            )
        )[0]
        assert user_2_subscriber_3.subscriber_id == 3
        assert user_2_subscriber_3.is_delete == True

        user_3_subscribers: List[Subscription] = (
            session.query(Subscription)
            .filter(Subscription.is_current == True, Subscription.user_id == 3)
            .all()
        )
        assert len(user_3_subscribers) == 1
        # Automatic unsubscribe on unfollow
        user_3_subscriber = user_3_subscribers[0]
        assert user_3_subscriber.subscriber_id == 1
        assert user_3_subscriber.is_delete == True

        # Verify saves
        all_saves: List[Save] = session.query(Save).all()
        assert len(all_saves) == 2

        current_saves: List[Save] = (
            session.query(Save).filter(Save.is_current == True).all()
        )
        assert len(current_saves) == 2
        current_save = current_saves[0]
        assert current_save.is_delete == True
        assert current_save.save_type == EntityType.TRACK.value.lower()
        assert current_save.save_item_id == 1
        assert current_save.user_id == 1

        current_save = current_saves[1]
        assert current_save.save_type == EntityType.TRACK.value.lower()
        assert current_save.save_item_id == 1
        assert current_save.user_id == 2

        # Verify repost
        all_reposts: List[Repost] = session.query(Repost).all()
        assert len(all_reposts) == 2

        current_reposts: List[Repost] = (
            session.query(Repost).filter(Repost.is_current == True).all()
        )
        assert len(current_reposts) == 2
        assert current_reposts[0].is_delete == False
        assert current_reposts[0].repost_type == EntityType.PLAYLIST.value.lower()
        assert current_reposts[0].repost_item_id == 1
        assert current_reposts[0].user_id == 1
        assert current_reposts[0].is_repost_of_repost == True

        assert current_reposts[1].is_delete == False
        assert current_reposts[1].repost_type == EntityType.PLAYLIST.value.lower()
        assert current_reposts[1].repost_item_id == 1
        assert current_reposts[1].user_id == 3
        assert current_reposts[1].is_repost_of_repost == False

    with db.scoped_session() as session:
        aggregate_playlists: List[AggregatePlaylist] = (
            session.query(AggregatePlaylist)
            .filter(AggregatePlaylist.playlist_id == 1)
            .all()
        )
        assert len(aggregate_playlists) == 1
        aggregate_playlist = aggregate_playlists[0]
        assert aggregate_playlist.repost_count == 2
    calls = [
        mock.call.dispatch(ChallengeEvent.follow, 1, 1),
        mock.call.dispatch(ChallengeEvent.follow, 1, 1),
        mock.call.dispatch(ChallengeEvent.favorite, 1, 1),
        mock.call.dispatch(ChallengeEvent.favorite, 1, 1),
        mock.call.dispatch(ChallengeEvent.repost, 1, 1),
        mock.call.dispatch(ChallengeEvent.repost, 1, 1),
    ]
    bus_mock.assert_has_calls(calls, any_order=True)


def test_index_invalid_social_features(app, mocker):
    "Tests valid batch of social create/update/delete actions"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, None)

    tx_receipts = {
        "UserDoesNotExistTx1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "User",
                        "_userId": 21345,
                        "_action": "Follow",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "UserDoesNotMatchSignerTx2": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 3,
                        "_entityType": "User",
                        "_userId": 1,
                        "_action": "Unfollow",
                        "_metadata": "",
                        "_signer": "invalidwallet",
                    }
                )
            },
        ],
        "EntityDoesNotExistTx3": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 12323,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Save",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "UserCannotFollowThemselfTx4": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "User",
                        "_userId": 1,
                        "_action": "Follow",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "UserCannotSubscribeToThemselfTx5": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "User",
                        "_userId": 2,
                        "_action": "Subscribe",
                        "_metadata": "",
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "UserCannotRepostOwnTrackTx6": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Repost",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "UserCannotRepostOwnPlaylistTx7": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Repost",
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
            {"user_id": 2, "handle": "user-2", "wallet": "user2wallet"},
            {"user_id": 3, "handle": "user-3", "wallet": "user3wallet"},
        ],
        "follows": [{"follower_user_id": 1, "followee_user_id": 3}],
        "tracks": [{"track_id": 1, "owner_id": 1}],
        "playlists": [{"playlist_id": 1, "playlist_owner_id": 1}],
        "subscriptions": [{"subscriber_id": 3, "user_id": 2}],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=1,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

        # Verify follows
        all_follows: List[Follow] = session.query(Follow).all()
        assert len(all_follows) == 1

        # Verify subscriptions
        all_subscriptions: List[Subscription] = session.query(Subscription).all()
        assert len(all_subscriptions) == 1

        # Verify saves
        all_saves: List[Save] = session.query(Save).all()
        assert len(all_saves) == 0

        # Verify repost
        all_reposts: List[Repost] = session.query(Repost).all()
        assert len(all_reposts) == 0


def test_index_entity_update_and_social_feature(app, mocker):
    "Tests a playlist update and repost in the same block"
    bus_mock = mocker.patch(
        "src.challenges.challenge_event_bus.ChallengeEventBus", autospec=True
    )

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, challenge_event_bus=bus_mock)

    """
    const resp = await this.manageEntity({
        userId,
        entityType: EntityType.USER,
        entityId: followeeUserId,
        action: isUnfollow ? Action.UNFOLLOW : Action.FOLLOW,
        metadataMultihash: ''
      })
    """
    test_metadata = {
        "QmUpdatePlaylist1": {
            "playlist_contents": {"track_ids": []},
            "description": "",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "playlist updated",
            "playlist_owner_id": 10,
        }
    }
    update_playlist1_json = json.dumps(test_metadata["QmUpdatePlaylist1"])

    tx_receipts = {
        "RepostPlaylistTx1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Playlist",
                        "_userId": 11,
                        "_action": "Repost",
                        "_metadata": "",
                        "_signer": "user11wallet",
                    }
                )
            },
        ],
        "UpdatePlaylist1Tx2": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Playlist",
                        "_userId": 10,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "QmUpdatePlaylist1", "data": {update_playlist1_json}}}',
                        "_signer": "user10wallet",
                    }
                )
            },
        ],
        "RepostPlaylistTx3": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Playlist",
                        "_userId": 12,
                        "_action": "Repost",
                        "_metadata": "",
                        "_signer": "user12wallet",
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
            {"user_id": i, "handle": f"user-{i}", "wallet": f"user{i}wallet"}
            for i in range(1, 13)
        ],
        "playlists": [{"playlist_id": 1, "playlist_owner_id": 10}],
    }
    social_feature_entities = {
        "reposts": [
            {"repost_item_id": 1, "repost_type": "playlist", "user_id": i}
            for i in range(1, 10)
        ],
    }
    populate_mock_db(db, entities)
    populate_mock_db(db, social_feature_entities)

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=2,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

        all_playlists: List[Playlist] = session.query(Playlist).all()
        assert len(all_playlists) == 1

        all_reposts: List[Repost] = session.query(Repost).all()
        assert len(all_reposts) == 11

        all_notifications: List[Notification] = session.query(Notification).all()
        assert len(all_notifications) == 12

        all_milestones: List[Milestone] = session.query(Milestone).all()
        assert len(all_milestones) == 1


def test_index_social_feature_hits_exceptions_on_repost(app, mocker):
    "Tests a playlist update and repost in the same block"
    bus_mock = mocker.patch(
        "src.challenges.challenge_event_bus.ChallengeEventBus", autospec=True
    )

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, challenge_event_bus=bus_mock)

    """
    const resp = await this.manageEntity({
        userId,
        entityType: EntityType.USER,
        entityId: followeeUserId,
        action: isUnfollow ? Action.UNFOLLOW : Action.FOLLOW,
        metadataMultihash: ''
      })
    """
    tx_receipts = {
        "RepostPlaylistTx1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Playlist",
                        "_userId": 11,
                        # metadata is formatted invalid, should be string
                        "_metadata": 1,
                        "_action": "Repost",
                        "_signer": "user11wallet",
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
            {"user_id": i, "handle": f"user-{i}", "wallet": f"user{i}wallet"}
            for i in range(1, 13)
        ],
        "playlists": [{"playlist_id": 1, "playlist_owner_id": 10}],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=2,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )
        all_reposts: List[Repost] = session.query(Repost).all()
        assert len(all_reposts) == 1
        assert all_reposts[0].is_repost_of_repost == False


def test_index_social_feature_for_save_of_repost(app, mocker):
    "Tests a playlist update and repost in the same block"
    bus_mock = mocker.patch(
        "src.challenges.challenge_event_bus.ChallengeEventBus", autospec=True
    )

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, challenge_event_bus=bus_mock)

    """
    const resp = await this.manageEntity({
        userId,
        entityType: EntityType.USER,
        entityId: followeeUserId,
        action: isUnfollow ? Action.UNFOLLOW : Action.FOLLOW,
        metadataMultihash: ''
      })
    """
    tx_receipts = {
        "SaveTrackTx3": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Save",
                        "_metadata": '{"is_save_of_repost": true}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "SaveTrackTx4": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Save",
                        "_metadata": '{"is_save_of_repost": false}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "SaveTrackTx5": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 3,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Save",
                        "_metadata": 1,
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
            {"user_id": i, "handle": f"user-{i}", "wallet": f"user{i}wallet"}
            for i in range(1, 13)
        ],
        "playlists": [
            {"playlist_id": i, "playlist_owner_id": 10} for i in range(1, 10)
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=2,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )
        all_saves: List[Save] = session.query(Save).all()
        assert len(all_saves) == 3
        assert all_saves[0].is_save_of_repost == True
        assert all_saves[1].is_save_of_repost == False
        assert all_saves[2].is_save_of_repost == False


def test_index_social_feature_playlist_type(app, mocker):
    "Tests playlist / album types"
    bus_mock = mocker.patch(
        "src.challenges.challenge_event_bus.ChallengeEventBus", autospec=True
    )

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, challenge_event_bus=bus_mock)

    tx_receipts = {
        "SavePlaylistTx1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Save",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "SaveAlbumTx2": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Save",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "RepostPlaylistTx3": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Repost",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "RepostAlbumTx4": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Repost",
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
            {"user_id": 2, "handle": "user-2", "wallet": "user2wallet"},
        ],
        "playlists": [
            {"playlist_id": 1, "playlist_owner_id": 2},
            {"playlist_id": 2, "playlist_owner_id": 2, "is_album": True},
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=1,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

        # Verify saves
        playlist_save: List[Save] = (
            session.query(Save).filter(Save.save_item_id == 1).first()
        )
        assert playlist_save.save_type == "playlist"

        album_save: List[Save] = (
            session.query(Save).filter(Save.save_item_id == 2).first()
        )
        assert album_save.save_type == "playlist"

        # Verify repost
        playlist_repost: List[Repost] = (
            session.query(Repost).filter(Repost.repost_item_id == 1).first()
        )
        assert playlist_repost.repost_type == "playlist"

        album_repost: List[Repost] = (
            session.query(Repost).filter(Repost.repost_item_id == 2).first()
        )
        assert album_repost.repost_type == "playlist"

        aggregate_playlist: List[AggregatePlaylist] = (
            session.query(AggregatePlaylist)
            .filter(AggregatePlaylist.playlist_id == 1)
            .first()
        )
        assert aggregate_playlist.is_album == False
        assert aggregate_playlist.save_count == 1
        assert aggregate_playlist.repost_count == 1

        album_playlist: List[AggregatePlaylist] = (
            session.query(AggregatePlaylist)
            .filter(AggregatePlaylist.playlist_id == 2)
            .first()
        )
        assert album_playlist.is_album == True
        assert album_playlist.save_count == 1
        assert album_playlist.repost_count == 1


def test_index_social_feature_hidden_item(app, mocker):
    # create an unlisted playlist and unlisted track, see if faving does anything
    "Tests a playlist update and repost in the same block"
    bus_mock = mocker.patch(
        "src.challenges.challenge_event_bus.ChallengeEventBus", autospec=True
    )

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, challenge_event_bus=bus_mock)

    tx_receipts = {
        "RepostPlaylistTx1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Playlist",
                        "_userId": 11,
                        # metadata is formatted invalid, should be string
                        "_metadata": 1,
                        "_action": "Repost",
                        "_signer": "user11wallet",
                    }
                )
            },
        ],
        "FavoriteTrackTx2": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "Track",
                        "_userId": 11,
                        # metadata is formatted invalid, should be string
                        "_metadata": 1,
                        "_action": "Save",
                        "_signer": "user11wallet",
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
            {"user_id": i, "handle": f"user-{i}", "wallet": f"user{i}wallet"}
            for i in range(1, 13)
        ],
        "playlists": [{"playlist_id": 1, "playlist_owner_id": 10, "is_private": True}],
        "tracks": [{"track_id": 1, "owner_id": 10, "is_private": True}],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=2,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )
        all_reposts: List[Repost] = session.query(Repost).all()
        all_favorites: List[Save] = session.query(Save).all()
        assert len(all_reposts) == 0
        assert len(all_favorites) == 0
