import json
import logging
from datetime import datetime, timedelta
from typing import List

import pytest
from web3 import Web3
from web3.datastructures import AttributeDict

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.challenges.challenge_event_bus import ChallengeEventBus, setup_challenge_bus
from src.models.playlists.playlist import Playlist
from src.models.playlists.playlist_route import PlaylistRoute
from src.models.playlists.playlists_tracks_relations import PlaylistsTracksRelations
from src.models.tracks.track import Track
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.utils import PLAYLIST_ID_OFFSET
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)

# Insert Playlist with two new tracks and check that a notification is created for the track owners
now = datetime.now()
entities = {
    "users": [
        {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
    ],
    "tracks": [
        {"track_id": 20, "owner_id": 1},
        {"track_id": 10, "owner_id": 2},
        {"track_id": 30, "owner_id": 15},
        {"track_id": 40, "owner_id": 12},
    ],
    "playlists": [
        {
            "playlist_owner_id": 1,
            "playlist_id": PLAYLIST_ID_OFFSET,
            "created_at": now,
            "updated_at": now,
            "playlist_name": "test_playlist",
            "description": "test_description",
            "playlist_contents": {
                "track_ids": [
                    {"time": datetime.timestamp(now), "track": 20},
                    {"time": datetime.timestamp(now), "track": 30},
                    {"time": datetime.timestamp(now), "track": 10},
                    {
                        "time": datetime.timestamp(now - timedelta(minutes=1)),
                        "track": 40,
                    },
                ]
            },
        },
    ],
}

test_metadata = {
    "AlbumTracklistUpdate": {
        "playlist_contents": {
            "track_ids": [
                {"time": 1660927554, "track": 10},
                {"time": 1660927554, "track": 20},
            ]
        }
    },
}

tx_receipts = {
    "UpdateAlbumTracklistUpdate": [
        {
            "args": AttributeDict(
                {
                    "_entityId": PLAYLIST_ID_OFFSET,
                    "_entityType": "Playlist",
                    "_userId": 1,
                    "_action": "Update",
                    "_metadata": f'{{"cid": "AlbumTracklistUpdate", "data": {json.dumps(test_metadata["AlbumTracklistUpdate"])}, "timestamp": {datetime.timestamp(now)}}}',
                    "_signer": "user1wallet",
                }
            )
        }
    ]
}

def test_add_playlist(app, mocker):
    with app.app_context():
        db = get_db()
        web3 = Web3()
        challenge_event_bus: ChallengeEventBus = setup_challenge_bus()
        update_task = UpdateTask(web3, challenge_event_bus)

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts[tx_receipt["transactionHash"].decode("utf-8")]

    mocker.patch(
        "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
        side_effect=get_events_side_effect,
        autospec=True,
    )

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]
        
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )
        relations: List[PlaylistsTracksRelations] = (
            session.query(PlaylistsTracksRelations).all()
        )
        print(relations)
        assert len(relations) == 2
        for id in [10, 20]:
            assert any([relation.track_id == id for relation in relations])
        for id in [30, 40]:
            assert not any([relation.track_id == id for relation in relations])
