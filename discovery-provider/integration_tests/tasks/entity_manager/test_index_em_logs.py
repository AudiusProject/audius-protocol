import json
import logging  # pylint: disable=C0302
from typing import List

from src.models.indexing.block import Block

from integration_tests.challenges.index_helpers import UpdateTask
from src.models.indexing.em_log import EMLog
from src.models.indexing.skipped_transaction import SkippedTransaction
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.utils import (
    CHARACTER_LIMIT_USER_BIO,
    TRACK_ID_OFFSET,
    USER_ID_OFFSET,
)
from src.utils.config import shared_config
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis
from web3 import Web3
from web3.datastructures import AttributeDict

logger = logging.getLogger(__name__)


def test_index_em_logs(app, mocker):
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
        "UpdateUser1Bio": {
            "is_verified": False,
            "is_deactivated": False,
            "name": "",
            "handle": "isaac",
            "profile_picture": None,
            "profile_picture_sizes": "QmIsaacProfile",
            "cover_photo": None,
            "cover_photo_sizes": "QmIsaacCoverPhoto",
            "bio": "UpdateUser1Bio",
            "location": "Los Angeles, CA",
            "creator_node_endpoint": "https://creatornode2.audius.co,https://creatornode3.audius.co,https://content-node.audius.co",
            "associated_wallets": None,
            "associated_sol_wallets": None,
            "playlist_library": {"contents": []},
            "events": None,
        },
    }
    create_user1_json = json.dumps(test_metadata["QmCreateUser1"])
    update_user1_json = json.dumps(test_metadata["UpdateUser1Bio"])
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
        "UpdateUser1Bio": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": USER_ID_OFFSET + 1,
                        "_entityType": "User",
                        "_userId": USER_ID_OFFSET + 1,
                        "_action": "Update",
                        "_metadata": f'{{"cid":"UpdateUser1Bio", "data": {update_user1_json}}}',
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

    "Tests valid batch of tracks create/update/delete actions"
    with db.scoped_session() as session:
        # index transactions
        block_0 = Block(
            blockhash="0hash",
            parenthash="-1hash",
            number=0,
            is_current=True,
        )

        session.add(block_0)

        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1585336422,
            block_hash=0,
        )
        em_logs: List[EMLog] = session.query(EMLog).all()
        print(f"asdf em_logs {em_logs}")
        assert len(em_logs) == 2

        create_user_1_em_log: List[EMLog] = (
            session.query(EMLog)
            .filter(EMLog.txhash == "0x4372656174655573657231")
            .first()
        )
        assert create_user_1_em_log.entity_type == "User"
        assert create_user_1_em_log.blocknumber == 0
        assert create_user_1_em_log.prev_record == None
    
        update_user_1_em_log: List[EMLog] = (
            session.query(EMLog)
            .filter(EMLog.txhash == "0x557064617465557365723142696f")
            .first()
        )
        assert update_user_1_em_log.entity_type == "User"
        assert update_user_1_em_log.blocknumber == 0
        assert update_user_1_em_log.prev_record["bio"] == "QmCreateUser1"
