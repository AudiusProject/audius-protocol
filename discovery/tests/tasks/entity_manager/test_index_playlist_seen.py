from typing import List

from sqlalchemy import desc
from web3 import Web3
from web3.datastructures import AttributeDict

from src.models.indexing.revert_block import RevertBlock
from src.models.notifications.notification import PlaylistSeen
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.utils import Action, EntityType
from src.utils.db_session import get_db
from tests.challenges.index_helpers import UpdateTask
from tests.utils import populate_mock_db


def test_index_playlist_view(app, mocker):
    "Tests playlist view action"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, None)

    tx_receipts = {
        "PlaylistSeenTx1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": EntityType.NOTIFICATION,
                        "_userId": 1,
                        "_action": Action.VIEW_PLAYLIST,
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "PlaylistSeenTx2": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 2,
                        "_entityType": EntityType.NOTIFICATION,
                        "_userId": 1,
                        "_action": Action.VIEW_PLAYLIST,
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "PlaylistSeenTx3": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": EntityType.NOTIFICATION,
                        "_userId": 2,
                        "_action": Action.VIEW_PLAYLIST,
                        "_metadata": "",
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

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts[tx_receipt["transactionHash"].decode("utf-8")]

    mocker.patch(
        "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
        side_effect=get_events_side_effect,
        autospec=True,
    )

    entities = {
        "users": [
            {"user_id": user_id, "wallet": f"user{user_id}wallet"}
            for user_id in range(1, 4)
        ],
        "playlists": [
            {"playlist_id": idx, "playlist_owner_id": idx} for idx in range(1, 4)
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        timstamp = 1000000000
        # index transactions
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1000000000,
            block_hash=hex(0),
        )

        # validate db records
        all_playlist_seen: List[PlaylistSeen] = (
            session.query(PlaylistSeen)
            .order_by(desc(PlaylistSeen.user_id), desc(PlaylistSeen.playlist_id))
            .all()
        )
        assert len(all_playlist_seen) == 3
        all_playlist_seen[0].is_current == True
        all_playlist_seen[0].user_id == 1
        all_playlist_seen[0].playlist_id == 1
        all_playlist_seen[0].blocknumber == 0
        all_playlist_seen[0].seen_at == timstamp

        all_playlist_seen[1].is_current == True
        all_playlist_seen[1].user_id == 1
        all_playlist_seen[1].playlist_id == 2
        all_playlist_seen[1].blocknumber == 0
        all_playlist_seen[1].seen_at == timstamp

        all_playlist_seen[2].is_current == True
        all_playlist_seen[2].user_id == 1
        all_playlist_seen[2].playlist_id == 1
        all_playlist_seen[2].blocknumber == 0
        all_playlist_seen[2].seen_at == timstamp

    tx_receipts = {
        "PlaylistSeenTx1": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": EntityType.NOTIFICATION,
                        "_userId": 1,
                        "_action": Action.VIEW_PLAYLIST,
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

    with db.scoped_session() as session:
        # index transactions
        timestamp = 1000000001
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=1,
            block_timestamp=timestamp,
            block_hash=hex(0),
        )
        revert_block: List[RevertBlock] = (
            session.query(RevertBlock).filter(RevertBlock.blocknumber == 1).first()
        )
        assert len(revert_block.prev_records["playlist_seen"]) == 1

        prev_playlist_seen = PlaylistSeen(
            **revert_block.prev_records["playlist_seen"][0]
        )
        prev_playlist_seen.is_current == False
        prev_playlist_seen.user_id == 1
        prev_playlist_seen.playlist_id == 1
        prev_playlist_seen.blocknumber == 1
        prev_playlist_seen.seen_at == timestamp
