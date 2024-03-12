import json
from datetime import datetime
from typing import List

import pytest
from sqlalchemy import desc
from web3.datastructures import AttributeDict

from integration_tests.utils import populate_mock_db
from src.models.indexing.cid_data import CIDData
from src.models.users.user import User
from src.tasks.entity_manager.utils import (
    PLAYLIST_ID_OFFSET,
    TRACK_ID_OFFSET,
    USER_ID_OFFSET,
    copy_record,
    get_metadata_type_and_format,
    parse_metadata,
    save_cid_metadata,
)
from src.utils import helpers
from src.utils.db_session import get_db


def test_save_cid_metadata(app):
    """Tests that cid is persisted correctly"""
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


def test_valid_parse_metadata(app):
    """Test that cid metadata blobs are processed correctly"""
    with app.app_context():
        expected_cid_type = {
            "QmUpdateUser1": "user",
            "QmCreateTrack1": "track",
            "QmUpdatePlaylist1": "playlist_data",
        }
        expected_metadata = {
            "QmUpdateUser1": {
                "profile_picture": None,
                "profile_picture_sizes": "QmYRHAJ4YuLjT4fLLRMg5STnQA4yDpiBmzk5R3iCDTmkmk",
                "cover_photo": None,
                "cover_photo_sizes": "QmUk61QDUTzhNqjnCAWipSp3jnMmXBmtTUC2mtF5F6VvUy",
                "bio": "ðŸŒžðŸ‘„ðŸŒž",
                "name": "raymont updated",
                "location": "chik fil yay!!",
                "handle": "rayjacobsonupdated",
                "associated_wallets": None,
                "associated_sol_wallets": None,
                "collectibles": None,
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
                "is_deactivated": False,
                "is_storage_v2": False,
                "artist_pick_track_id": TRACK_ID_OFFSET,
                "allow_ai_attribution": False,
            },
            "QmCreateTrack1": {
                "track_cid": "some-track-cid",
                "owner_id": 1,
                "title": "track 1",
                "route_id": None,
                "duration": 0,
                "cover_art": None,
                "cover_art_sizes": "QmdxhDiRUC3zQEKqwnqksaSsSSeHiRghjwKzwoRvm77yaZ",
                "tags": "realmagic,rickyreed,theroom",
                "genre": "R&B/Soul",
                "mood": "Empowering",
                "credits_splits": None,
                "create_date": "2020-07-11 08:22:15",
                "release_date": "Sat Jul 11 2020 01:19:58 GMT-0700",
                "file_type": None,
                "description": None,
                "license": "All rights reserved",
                "isrc": None,
                "iswc": None,
                "track_segments": [
                    {
                        "duration": 6.016,
                        "multihash": "QmabM5svgDgcRdQZaEKSMBCpSZrrYy2y87L8Dx8EQ3T2jp",
                    }
                ],
                "download": {
                    "cid": None,
                    "is_downloadable": False,
                    "requires_follow": False,
                },
                "remix_of": {"tracks": [{"parent_track_id": 75808}]},
                "is_scheduled_release": False,
                "is_unlisted": False,
                "field_visibility": {
                    "mood": True,
                    "tags": True,
                    "genre": True,
                    "share": True,
                    "play_count": True,
                    "remixes": True,
                },
                "stem_of": None,
                "is_stream_gated": False,
                "stream_conditions": None,
                "is_download_gated": False,
                "download_conditions": None,
                "is_playlist_upload": True,
                "ai_attribution_user_id": None,
                "preview_cid": None,
                "orig_file_cid": None,
                "orig_filename": None,
                "is_downloadable": False,
                "is_original_available": False,
                "preview_start_seconds": None,
                "audio_upload_id": None,
                "placement_hosts": None,
                "ddex_app": None,
                "playlists_containing_track": None,
            },
            "QmUpdatePlaylist1": {
                "playlist_id": 1,
                "playlist_contents": {"track_ids": [{"time": 1660927554, "track": 1}]},
                "playlist_name": "playlist 1 updated",
                "playlist_image_sizes_multihash": "",
                "description": "",
                "is_album": False,
                "is_private": False,
                "is_image_autogenerated": None,
                "ddex_app": None,
            },
        }

        user1_tx_metadata = expected_metadata["QmUpdateUser1"].copy()
        # Add invalid unicode to verify fetch_cid_metadata sanitizes metadata
        user1_tx_metadata["name"] += "\ud835"
        user1_json = json.dumps(user1_tx_metadata)

        track1_tx_metadata = expected_metadata["QmCreateTrack1"].copy()
        track1_tx_metadata.pop("stream_conditions")
        track1_tx_metadata["incorrect_key"] = True
        track1_json = json.dumps(track1_tx_metadata)

        playlist1_tx_metadata = expected_metadata["QmUpdatePlaylist1"].copy()
        playlist1_json = json.dumps(playlist1_tx_metadata)

        tx_receipts = {
            "UpdateUser1Tx": [
                {
                    "args": AttributeDict(
                        {
                            "_entityId": USER_ID_OFFSET,
                            "_entityType": "User",
                            "_userId": USER_ID_OFFSET,
                            "_action": "Update",
                            "_metadata": f'{{"cid": "QmUpdateUser1", "data": {user1_json}}}',
                            "_signer": "user1wallet",
                        }
                    )
                },
            ],
            "CreateTrack1Tx": [
                {
                    "args": AttributeDict(
                        {
                            "_entityId": TRACK_ID_OFFSET,
                            "_entityType": "Track",
                            "_userId": 1,
                            "_action": "Create",
                            "_metadata": f'{{"cid": "QmCreateTrack1", "data": {track1_json}}}',
                            "_signer": "user1wallet",
                        }
                    )
                },
            ],
            "UpdatePlaylist1Tx": [
                {
                    "args": AttributeDict(
                        {
                            "_entityId": PLAYLIST_ID_OFFSET,
                            "_entityType": "Playlist",
                            "_userId": 1,
                            "_action": "Update",
                            "_metadata": f'{{"cid": "QmUpdatePlaylist1", "data": {playlist1_json}}}',
                            "_signer": "user1wallet",
                        }
                    )
                },
            ],
        }

        for tx_receipt in tx_receipts.values():
            for event in tx_receipt:
                metadata = helpers.get_tx_arg(event, "_metadata")
                action = helpers.get_tx_arg(event, "_action")
                entity_type = helpers.get_tx_arg(event, "_entityType")
                cid_metadata, cid = parse_metadata(metadata, action, entity_type)
                metadata_type, _ = get_metadata_type_and_format(entity_type)
                assert cid is not None
                assert cid in expected_metadata
                assert cid_metadata == expected_metadata[cid]
                assert metadata_type == expected_cid_type[cid]


def test_invalid_parse_metadata(app):
    """Test that invalid cid metadata blobs are not processed"""
    with app.app_context():
        track_metadata = {
            "track_cid": "some-track-cid",
            "owner_id": 1,
            "title": "track 1",
            "route_id": None,
            "duration": 0,
            "cover_art": None,
            "cover_art_sizes": "QmdxhDiRUC3zQEKqwnqksaSsSSeHiRghjwKzwoRvm77yaZ",
            "tags": "realmagic,rickyreed,theroom",
            "genre": "R&B/Soul",
            "mood": "Empowering",
            "credits_splits": None,
            "create_date": "2020-07-11 08:22:15",
            "release_date": "Sat Jul 11 2020 01:19:58 GMT-0700",
            "file_type": None,
            "description": None,
            "license": "All rights reserved",
            "isrc": None,
            "iswc": None,
            "track_segments": [
                {
                    "duration": 6.016,
                    "multihash": "QmabM5svgDgcRdQZaEKSMBCpSZrrYy2y87L8Dx8EQ3T2jp",
                }
            ],
            "download": {
                "cid": None,
                "is_downloadable": False,
                "requires_follow": False,
            },
            "remix_of": {"tracks": [{"parent_track_id": 75808}]},
            "is_scheduled_release": False,
            "is_unlisted": False,
            "field_visibility": {
                "mood": True,
                "tags": True,
                "genre": True,
                "share": True,
                "play_count": True,
                "remixes": True,
            },
            "stem_of": None,
            "is_stream_gated": False,
            "stream_conditions": None,
            "is_playlist_upload": True,
            "ai_attribution_user_id": None,
        }
        track_json = json.dumps(track_metadata)

        tx_receipts = {
            "CreateTrack2InvalidTx": [
                {
                    "args": AttributeDict(
                        {
                            "_entityId": TRACK_ID_OFFSET + 1,
                            "_entityType": "Track",
                            "_userId": 1,
                            "_action": "Create",
                            "_metadata": f'{{"cid": "QmCreateInvalidTrack", "data": "{track_json}"}}',  # stringified value for data key
                            "_signer": "user1wallet",
                        }
                    )
                },
            ],
            "CreateTrack3InvalidTx": [
                {
                    "args": AttributeDict(
                        {
                            "_entityId": TRACK_ID_OFFSET + 2,
                            "_entityType": "Track",
                            "_userId": 1,
                            "_action": "Create",
                            "_metadata": f'{{"data": {track_json}}}',  # missing cid key
                            "_signer": "user1wallet",
                        }
                    )
                },
            ],
            "CreateTrack4InvalidTx": [
                {
                    "args": AttributeDict(
                        {
                            "_entityId": TRACK_ID_OFFSET + 3,
                            "_entityType": "Track",
                            "_userId": 1,
                            "_action": "Create",
                            "_metadata": '{"cid": "QmCreateInvalidTrack", "data": {}}',  # no values in data json
                            "_signer": "user1wallet",
                        }
                    )
                },
            ],
        }

        for tx_receipt in tx_receipts.values():
            for event in tx_receipt:
                metadata = helpers.get_tx_arg(event, "_metadata")
                action = helpers.get_tx_arg(event, "_action")
                entity_type = helpers.get_tx_arg(event, "_entityType")
                with pytest.raises(Exception):
                    parse_metadata(metadata, action, entity_type)


def test_copy_record(app):
    with app.app_context():
        db = get_db()

    entities = {
        "users": [
            {
                "user_id": 1,
                "handle": "user-1",
                "wallet": "user1wallet",
                "bio": "hi",
                "primary_id": 1,
                "secondary_ids": [2, 3],
                "artist_pick_track_id": 1,
            }
        ]
    }
    populate_mock_db(db, entities)
    with db.scoped_session() as session:
        all_users: List[User] = session.query(User).all()
        assert len(all_users) == 1
        user_1 = all_users[0]
        user_1_updated_at = user_1.updated_at
        user_1_block_number = user_1.blocknumber
        user_1_blockhash = user_1.blockhash
        user_1_txhash = user_1.txhash

        block_number = 10
        event_blockhash = hex(10)
        txhash = "0x01"
        block_datetime = datetime.now()
        user_1_copy = copy_record(
            user_1, block_number, event_blockhash, txhash, block_datetime
        )

        old_user_attributes = user_1.get_attributes_dict()
        user_copy_attributes = user_1_copy.get_attributes_dict()
        for key, value in user_copy_attributes.items():
            if key == "is_current":
                assert value == False
                assert old_user_attributes[key] == True
            elif key == "updated_at":
                assert value == block_datetime
                assert old_user_attributes[key] == user_1_updated_at
            elif key == "blocknumber":
                assert value == block_number
                assert old_user_attributes[key] == user_1_block_number
            elif key == "blockhash":
                assert value == event_blockhash
                assert old_user_attributes[key] == user_1_blockhash
            elif key == "txhash":
                assert value == txhash
                assert old_user_attributes[key] == user_1_txhash
            else:
                assert value == old_user_attributes[key]
