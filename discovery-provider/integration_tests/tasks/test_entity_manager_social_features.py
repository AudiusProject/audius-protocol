from typing import List

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.models.social.follow import Follow
from src.models.social.save import Save
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.utils.db_session import get_db
from web3 import Web3
from web3.datastructures import AttributeDict


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
        ],
        "follows": [{"follower_user_id": 1, "followee_user_id": 3}],
        "tracks": [{"track_id": 1}],
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
            ipfs_metadata=test_metadata,
        )
        all_follows: List[Follow] = session.query(Follow).all()
        assert len(all_follows) == 3

        user1_follows: List[Follow] = (
            session.query(Follow)
            .filter(
                Follow.is_current == True,
                Follow.is_delete == False,
                Follow.follower_user_id == 1,
            )
            .all()
        )
        assert len(user1_follows) == 1
        assert user1_follows[0].followee_user_id == 2

        user1_deleted_follows: List[Follow] = (
            session.query(Follow)
            .filter(
                Follow.is_current == True,
                Follow.is_delete == True,
                Follow.follower_user_id == 1,
            )
            .all()
        )
        assert len(user1_deleted_follows) == 1
        assert user1_deleted_follows[0].followee_user_id == 3

        current_saves: List[Save] = (
            session.query(Save).filter(Save.is_current == True).all()
        )
        assert len(current_saves) == 1
        current_save = current_saves[0]
        assert current_save.is_delete == True
    pass
