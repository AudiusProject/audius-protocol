from datetime import datetime
from typing import List

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.models.playlists.playlist import Playlist
from src.models.social.follow import Follow
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.utils import PLAYLIST_ID_OFFSET
from src.utils.db_session import get_db
from web3 import Web3
from web3.datastructures import AttributeDict


def test_index_valid_social_features(app, mocker):
    "Tests valid batch of playlists create/update/delete actions"

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
    # Users 1 & 3 both follow User 2
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
        "FollowUserTx2": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "User",
                        "_userId": 3,
                        "_action": "Follow",
                        "_metadata": "",
                        "_signer": "user3wallet",
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
    test_metadata = {}

    entities = {
        "users": [
            {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
            {"user_id": 2, "handle": "user-2", "wallet": "user2wallet"},
            {"user_id": 3, "handle": "user-3", "wallet": "user3wallet"},
        ]
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            None,
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1585336422,
            block_hash=0,
            ipfs_metadata=test_metadata,
        )
        all_follows: List[Follow] = session.query(Follow).all()
        assert len(all_follows) == 2
        first_follow = all_follows[0]
        second_follow = all_follows[1]
        assert first_follow.is_current == True
        assert second_follow.is_current == True
        assert first_follow.follower_user_id == 1
        assert second_follow.follower_user_id == 3
