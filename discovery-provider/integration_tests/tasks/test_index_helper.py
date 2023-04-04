import json

from integration_tests.challenges.index_helpers import UpdateTask
from sqlalchemy import desc
from src.models.indexing.cid_data import CIDData
from src.tasks.entity_manager.utils import TRACK_ID_OFFSET, USER_ID_OFFSET
from src.tasks.index import save_cid_metadata
from src.tasks.index_nethermind import fetch_cid_metadata
from src.utils.cid_metadata_client import CIDMetadataClient
from src.utils.db_session import get_db
from web3 import Web3
from web3.datastructures import AttributeDict


def test_save_cid_metadata(app):
    """Tests that users are indexed correctly"""
    with app.app_context():
        db = get_db()

        with db.scoped_session() as session:
            cid_metadata = {
                "cid1": {"user_id": 1},
                "cid2": {"user_id": 2},
                "cid3": {"track_id": 2},
                "cid4": {"playlist_id": 3},
            }
            cid_type = {
                "cid1": "user",
                "cid2": "user",
                "cid3": "track",
                "cid4": "playlist_data",
            }
            save_cid_metadata(session, cid_metadata, cid_type)

            users = (
                session.query(CIDData)
                .filter(CIDData.type == "user")
                .order_by(desc(CIDData.cid))
                .all()
            )
            assert len(users) == 2
            assert users[0].data == {"user_id": 2}
            assert users[1].data == {"user_id": 1}

            tracks = session.query(CIDData).filter(CIDData.type == "track").all()
            assert len(tracks) == 1
            assert tracks[0].data == {"track_id": 2}

            playlists = (
                session.query(CIDData).filter(CIDData.type == "playlist_data").all()
            )
            assert len(playlists) == 1
            assert playlists[0].data == {"playlist_id": 3}


def test_fetch_cid_metadata(app, mocker):
    """Test that cid metadata blobs are processed correctly"""
    # Only test case where metadata blobs are passed directly
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(CIDMetadataClient, web3, None)

        expected_cid_type = {"QmUpdateUser1": "user"}
        expected_metadata = {
            "QmUpdateUser1": {
                "is_verified": False,
                "is_deactivated": False,
                "name": "raymont updated",
                "handle": "rayjacobsonupdated",
                "profile_picture": None,
                "profile_picture_sizes": "QmYRHAJ4YuLjT4fLLRMg5STnQA4yDpiBmzk5R3iCDTmkmk",
                "cover_photo": None,
                "cover_photo_sizes": "QmUk61QDUTzhNqjnCAWipSp3jnMmXBmtTUC2mtF5F6VvUy",
                "bio": "ðŸŒžðŸ‘„ðŸŒž",
                "location": "chik fil yay!!",
                "artist_pick_track_id": TRACK_ID_OFFSET,
                "creator_node_endpoint": "https://creatornode.audius.co,https://content-node.audius.co,https://blockdaemon-audius-content-06.bdnodes.net",
                "associated_wallets": None,
                "associated_sol_wallets": None,
                "playlist_library": {
                    "contents": [
                        {"playlist_id": "Audio NFTs", "type": "explore_playlist"},
                        {"playlist_id": 4327, "type": "playlist"},
                        {"playlist_id": 52792, "type": "playlist"},
                        {"playlist_id": 63949, "type": "playlist"},
                        {
                            "contents": [
                                {"playlist_id": 6833, "type": "playlist"},
                                {"playlist_id": 4735, "type": "playlist"},
                                {"playlist_id": 114799, "type": "playlist"},
                                {"playlist_id": 115049, "type": "playlist"},
                                {"playlist_id": 89495, "type": "playlist"},
                            ],
                            "id": "d515f4db-1db2-41df-9e0c-0180302a24f9",
                            "name": "WIP",
                            "type": "folder",
                        },
                        {
                            "contents": [
                                {"playlist_id": 9616, "type": "playlist"},
                                {"playlist_id": 112826, "type": "playlist"},
                            ],
                            "id": "a0da6552-ddc4-4d13-a19e-ecc63ca23e90",
                            "name": "Community",
                            "type": "folder",
                        },
                        {
                            "contents": [
                                {"playlist_id": 128608, "type": "playlist"},
                                {"playlist_id": 90778, "type": "playlist"},
                                {"playlist_id": 94395, "type": "playlist"},
                                {"playlist_id": 97193, "type": "playlist"},
                            ],
                            "id": "1163fbab-e710-4d33-8769-6fcb02719d7b",
                            "name": "Actually Albums",
                            "type": "folder",
                        },
                        {"playlist_id": 131423, "type": "playlist"},
                        {"playlist_id": 40151, "type": "playlist"},
                    ]
                },
                "events": {"is_mobile_user": True},
                "user_id": USER_ID_OFFSET,
            },
        }

        user1JSON = json.dumps(expected_metadata["QmUpdateUser1"])
        tx_receipts = {
            "UpdateUser1Tx": [
                {
                    "args": AttributeDict(
                        {
                            "_entityId": USER_ID_OFFSET,
                            "_entityType": "User",
                            "_userId": USER_ID_OFFSET,
                            "_action": "Update",
                            "_metadata": f'{{"cid": "QmUpdateUser1", "data": {user1JSON}}}',
                            "_signer": "user1wallet",
                        }
                    )
                },
            ],
        }

        def get_events_side_effect(_, _event_type, tx_receipt):
            return tx_receipts[tx_receipt.transactionHash.decode("utf-8")]

        mocker.patch(
            "src.tasks.index_nethermind.get_entity_manager_events_tx",
            side_effect=get_events_side_effect,
            autospec=True,
        )
        mocker.patch(
            "src.tasks.index_nethermind.update_task",
            return_value=update_task.cid_metadata_client,
        )
        mocker.patch(
            "src.utils.cid_metadata_client.CIDMetadataClient.fetch_metadata_from_gateway_endpoints",
            return_value={},
        )

        entity_manager_txs = [
            AttributeDict(
                {"transactionHash": update_task.web3.toBytes(text=tx_receipt)}
            )
            for tx_receipt in tx_receipts
        ]
        cid_metadata, cid_type = fetch_cid_metadata(db, entity_manager_txs)
        assert cid_metadata == expected_metadata
        assert cid_type == expected_cid_type
