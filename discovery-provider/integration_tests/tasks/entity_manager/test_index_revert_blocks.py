import json
import logging  # pylint: disable=C0302
from typing import List

from web3 import Web3
from web3.datastructures import AttributeDict

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.models.indexing.revert_block import RevertBlock
from src.models.users.user import User
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.utils import USER_ID_OFFSET
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis

logger = logging.getLogger(__name__)


def test_index_revert_blocks(app, mocker):
    """
    Test valid indexing of revert_blocks
    """

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts[tx_receipt.transactionHash.decode("utf-8")]

    mocker.patch(
        "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
        side_effect=get_events_side_effect,
        autospec=True,
    )

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        redis = get_redis()
        bus_mock = mocker.patch(
            "src.challenges.challenge_event_bus.ChallengeEventBus", autospec=True
        )
        update_task = UpdateTask(web3, bus_mock, redis)

    test_metadata = {
        "QmCreateUser1": {
            "is_verified": False,
            "is_deactivated": False,
            "name": "Isaac",
            "handle": "isaac",
            "profile_picture": None,
            "profile_picture_sizes": "QmIsaacProfile",
            "cover_photo": None,
            "cover_photo_sizes": "QmIsaacCoverPhoto",
            "bio": "QmCreateUser1",
            "location": "Los Angeles, CA",
            "creator_node_endpoint": "https://creatornode2.audius.co,https://creatornode3.audius.co,https://content-node.audius.co",
            "associated_wallets": None,
            "associated_sol_wallets": None,
            "playlist_library": {"contents": []},
            "events": None,
        },
        "UpdateUser2Bio": {
            "is_verified": False,
            "is_deactivated": False,
            "name": "",
            "handle": "isaac",
            "profile_picture": None,
            "profile_picture_sizes": "QmIsaacProfile",
            "cover_photo": None,
            "cover_photo_sizes": "QmIsaacCoverPhoto",
            "bio": "UpdateUser2Bio",
            "location": "Los Angeles, CA",
            "creator_node_endpoint": "https://creatornode2.audius.co,https://creatornode3.audius.co,https://content-node.audius.co",
            "associated_wallets": None,
            "associated_sol_wallets": None,
            "playlist_library": {"contents": []},
            "events": None,
        },
    }
    create_user1_json = json.dumps(test_metadata["QmCreateUser1"])
    update_user2_json = json.dumps(test_metadata["UpdateUser2Bio"])
    tx_receipts = {
        "CreateUser1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": USER_ID_OFFSET + 1,
                        "_entityType": "User",
                        "_userId": USER_ID_OFFSET + 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid":"QmCreateUser1", "data": {create_user1_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "UpdateUser2Bio": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": "User",
                        "_userId": 2,
                        "_action": "Update",
                        "_metadata": f'{{"cid":"UpdateUser2Bio", "data": {update_user2_json}}}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    entities = {
        "users": [
            {
                "user_id": 2,
                "handle": "user-2",
                "wallet": "User2Wallet",
            },
        ],
    }
    populate_mock_db(db, entities)

    existing_user_2_dict = None
    with db.scoped_session() as session:
        # index transactions
        existing_user_2: User = session.query(User).first()
        existing_user_2_dict = existing_user_2.__dict__.copy()
        existing_user_2_dict.pop("_sa_instance_state")
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1585336422,
            block_hash=0,
        )
        updated_user_2: User = (
            session.query(User)
            .filter(User.user_id == 2, User.is_current == True)
            .first()
        )
        assert updated_user_2.bio == "UpdateUser2Bio"

        revert_blocks: List[RevertBlock] = session.query(RevertBlock).all()
        assert len(revert_blocks) == 1
        assert revert_blocks[0].blocknumber == 0
        assert len(revert_blocks[0].prev_records) == 1
        assert len(revert_blocks[0].prev_records["users"]) == 1
        user_2_json = revert_blocks[0].prev_records["users"][0]
        prev_user_2 = User(**user_2_json)
        session.add(prev_user_2)

    with db.scoped_session() as session:
        reverted_user_2: User = (
            session.query(User)
            .filter(User.user_id == 2, User.is_current == True)
            .first()
        )
        reverted_user_2_dict = reverted_user_2.__dict__
        reverted_user_2_dict.pop("_sa_instance_state")
        assert reverted_user_2_dict == existing_user_2_dict
