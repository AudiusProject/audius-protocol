import logging
from typing import List

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.models.playlists.aggregate_playlist import AggregatePlaylist
from src.models.social.follow import Follow
from src.models.social.repost import Repost
from src.models.social.save import Save
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.utils import EntityType
from src.utils.db_session import get_db
from web3 import Web3
from web3.datastructures import AttributeDict

logger = logging.getLogger(__name__)


def test_index_valid_social_features(app, mocker):
    "Tests valid batch of social create/update/delete actions"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(None, web3, None)

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
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.toBytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts[tx_receipt.transactionHash.decode("utf-8")]

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
        "tracks": [{"track_id": 1}],
        "reposts": [{"repost_item_id": 1, "repost_type": "playlist", "user_id": 1}],
        "playlists": [{"playlist_id": 1}],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            None,
            update_task,
            session,
            entity_manager_txs,
            block_number=1,
            block_timestamp=1585336422,
            block_hash=0,
            ipfs_metadata={},
        )

        # Verify follows
        all_follows: List[Follow] = session.query(Follow).all()
        assert len(all_follows) == 3

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

        # Verify saves

        all_saves: List[Save] = session.query(Save).all()
        assert len(all_saves) == 2

        current_saves: List[Save] = (
            session.query(Save).filter(Save.is_current == True).all()
        )
        assert len(current_saves) == 1
        current_save = current_saves[0]
        assert current_save.is_delete == True
        assert current_save.save_type == EntityType.TRACK.value.lower()
        assert current_save.save_item_id == 1

        # Verify repost

        all_reposts: List[Repost] = session.query(Repost).all()
        assert len(all_reposts) == 3

        current_reposts: List[Repost] = (
            session.query(Repost).filter(Repost.is_current == True).all()
        )
        assert len(current_reposts) == 1
        current_repost = current_reposts[0]
        assert current_repost.is_delete == False
        assert current_repost.repost_type == EntityType.PLAYLIST.value.lower()
        assert current_repost.repost_item_id == 1

        # ensure session is flushed, invalidating old records before bulk saving
        aggregate_playlists: List[aggregate_playlists] = (
            session.query(AggregatePlaylist)
            .filter(AggregatePlaylist.playlist_id == 1)
            .all()
        )
        assert len(aggregate_playlists) == 1
        aggregate_palylist = aggregate_playlists[0]
        assert aggregate_palylist.repost_count == 1


def test_index_invalid_social_features(app, mocker):
    "Tests valid batch of social create/update/delete actions"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(None, web3, None)

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
    }

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.toBytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts[tx_receipt.transactionHash.decode("utf-8")]

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
        "tracks": [{"track_id": 1}],
        "playlists": [{"playlist_id": 1}],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            None,
            update_task,
            session,
            entity_manager_txs,
            block_number=1,
            block_timestamp=1585336422,
            block_hash=0,
            ipfs_metadata={},
        )

        # Verify follows
        all_follows: List[Follow] = session.query(Follow).all()
        assert len(all_follows) == 1

        # Verify saves
        all_saves: List[Save] = session.query(Save).all()
        assert len(all_saves) == 0

        # Verify repost
        all_reposts: List[Repost] = session.query(Repost).all()
        assert len(all_reposts) == 0
