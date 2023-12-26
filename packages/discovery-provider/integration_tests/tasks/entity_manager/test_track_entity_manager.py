import json
import logging  # pylint: disable=C0302
from typing import List

from web3 import Web3
from web3.datastructures import AttributeDict

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.challenges.challenge_event_bus import ChallengeEventBus, setup_challenge_bus
from src.models.tracks.track import Track
from src.models.tracks.track_route import TrackRoute
from src.tasks.entity_manager.entity_manager import (
    ENABLE_DEVELOPMENT_FEATURES,
    entity_manager_update,
)
from src.tasks.entity_manager.utils import CHARACTER_LIMIT_DESCRIPTION, TRACK_ID_OFFSET
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


def test_index_valid_track(app, mocker):
    "Tests valid batch of tracks create/update/delete actions"

    if not ENABLE_DEVELOPMENT_FEATURES:
        logger.info("Skipping entity manager track testing")
        return

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        challenge_event_bus: ChallengeEventBus = setup_challenge_bus()
        update_task = UpdateTask(web3, challenge_event_bus)

    test_metadata = {
        "QmCreateTrack1": {
            "owner_id": 1,
            "track_cid": "some-track-cid",
            "title": "track 1",
            "cover_art": None,
            "cover_art_sizes": "QmdxhDiRUC3zQEKqwnqksaSsSSeHiRghjwKzwoRvm77yaZ",
            "tags": "realmagic,rickyreed,theroom",
            "genre": "R&B/Soul",
            "mood": "Empowering",
            "credits_splits": None,
            "created_at": "2020-07-11 08:22:15",
            "create_date": None,
            "updated_at": "2020-07-11 08:22:15",
            "release_date": "2020-07-11 08:22:15",
            "file_type": None,
            "is_playlist_upload": True,
            "duration": 100,
            "track_segments": [
                {
                    "duration": 6.016,
                    "multihash": "QmabM5svgDgcRdQZaEKSMBCpSZrrYy2y87L8Dx8EQ3T2jp",
                }
            ],
            "has_current_user_reposted": False,
            "is_current": True,
            "is_unlisted": True,
            "is_stream_gated": False,
            "stream_conditions": None,
            "is_download_gated": False,
            "download_conditions": None,
            "field_visibility": {
                "mood": True,
                "tags": True,
                "genre": True,
                "share": True,
                "play_count": True,
                "remixes": True,
            },
            "remix_of": {"tracks": [{"parent_track_id": 75808}]},
            "repost_count": 12,
            "save_count": 21,
            "description": None,
            "license": "All rights reserved",
            "isrc": None,
            "iswc": None,
            "download": {
                "cid": None,
                "is_downloadable": False,
                "requires_follow": False,
            },
            "track_id": 77955,
            "stem_of": None,
            "ai_attribution_user_id": 2,
            "orig_file_cid": "original-file-cid",
            "orig_filename": "original-filename",
            "is_downloadable": False,
            "is_original_available": False,
        },
        "QmCreateTrack2": {
            "owner_id": 1,
            "track_cid": "some-track-cid-2",
            "title": "track 2",
            "cover_art": None,
            "cover_art_sizes": "QmQKXkVxGBbCFjcnhgxftzYDhph1CT8PJCuPEsRpffjjGC",
            "tags": None,
            "genre": "Electronic",
            "mood": None,
            "credits_splits": None,
            "created_at": None,
            "create_date": None,
            "updated_at": None,
            "release_date": None,
            "file_type": None,
            "track_segments": [],
            "has_current_user_reposted": False,
            "is_current": True,
            "is_unlisted": False,
            "is_stream_gated": False,
            "stream_conditions": None,
            "is_download_gated": False,
            "download_conditions": None,
            "field_visibility": {
                "genre": True,
                "mood": True,
                "tags": True,
                "share": True,
                "play_count": True,
                "remixes": True,
            },
            "remix_of": None,
            "repost_count": 0,
            "save_count": 0,
            "description": "",
            "license": "",
            "isrc": "",
            "iswc": "",
            "is_playlist_upload": True,
            "duration": 200,
            "orig_file_cid": "original-file-cid-2",
            "orig_filename": "original-filename-2",
            "is_downloadable": False,
            "is_original_available": False,
        },
        "QmCreateTrack3": {
            "owner_id": 1,
            "track_cid": "some-track-cid-3",
            "title": "track 3",
            "cover_art": None,
            "cover_art_sizes": "QmQKXkVxGBbCFjcnhgxftzYDhph1CT8PJCuPEsRpffjjGC",
            "tags": None,
            "genre": "Rock",
            "mood": None,
            "credits_splits": None,
            "created_at": None,
            "create_date": None,
            "updated_at": None,
            "release_date": "2030-11-30T08:00:00.000Z",
            "file_type": None,
            "track_segments": [],
            "has_current_user_reposted": False,
            "is_current": True,
            "is_unlisted": False,
            "is_stream_gated": False,
            "stream_conditions": None,
            "is_download_gated": False,
            "download_conditions": None,
            "field_visibility": {
                "genre": True,
                "mood": True,
                "tags": True,
                "share": True,
                "play_count": True,
                "remixes": True,
            },
            "remix_of": None,
            "repost_count": 0,
            "save_count": 0,
            "description": "",
            "license": "",
            "isrc": "",
            "iswc": "",
            "is_playlist_upload": False,
            "orig_file_cid": "original-file-cid-3",
            "orig_filename": "original-filename-3",
            "is_downloadable": False,
            "is_original_available": False,
        },
        "QmCreateTrack4": {
            "owner_id": 2,
            "track_cid": "some-track-cid-4",
            "title": "track 4",
            "cover_art": None,
            "cover_art_sizes": "QmQKXkVxGBbCFjcnhgxftzYDhph1CT8PJCuPEsRpffjjGC",
            "tags": None,
            "genre": "Rock",
            "mood": None,
            "credits_splits": None,
            "created_at": None,
            "create_date": None,
            "updated_at": None,
            "release_date": None,
            "file_type": None,
            "track_segments": [],
            "has_current_user_reposted": False,
            "is_current": True,
            "is_unlisted": False,
            "is_stream_gated": False,
            "stream_conditions": None,
            "is_download_gated": False,
            "download_conditions": None,
            "field_visibility": {
                "genre": True,
                "mood": True,
                "tags": True,
                "share": True,
                "play_count": True,
                "remixes": True,
            },
            "remix_of": None,
            "repost_count": 0,
            "save_count": 0,
            "description": "",
            "license": "",
            "isrc": "",
            "iswc": "",
            "is_playlist_upload": False,
            "orig_file_cid": "original-file-cid-4",
            "orig_filename": "original-filename-4",
            "is_downloadable": False,
            "is_original_available": False,
        },
        "QmUpdateTrack1": {
            "title": "track 1 2",
            "description": "updated description",
        },
        "QmUpdateTrack2": {"is_unlisted": False},
    }

    create_track1_json = json.dumps(test_metadata["QmCreateTrack1"])
    create_track2_json = json.dumps(test_metadata["QmCreateTrack2"])
    create_track3_json = json.dumps(test_metadata["QmCreateTrack3"])
    create_track4_json = json.dumps(test_metadata["QmCreateTrack4"])
    update_track1_json = json.dumps(test_metadata["QmUpdateTrack1"])
    update_track2_json = json.dumps(test_metadata["QmUpdateTrack2"])
    tx_receipts = {
        "CreateTrack1Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreateTrack1", "data": {create_track1_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "UpdateTrack1Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "QmUpdateTrack1", "data": {update_track1_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "DeleteTrack1Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Delete",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateTrack2Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET + 1,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreateTrack2", "data": {create_track2_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "UpdateTrack2Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET + 1,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "QmUpdateTrack2", "data": {update_track2_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateTrack3Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET + 2,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreateTrack3", "data": {create_track3_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        # Delegated track write
        "CreateTrack4Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET + 3,
                        "_entityType": "Track",
                        "_userId": 2,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreateTrack4", "data": {create_track4_json}}}',
                        "_signer": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4C4",
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
            {
                "user_id": 2,
                "handle": "user-2",
                "wallet": "user2wallet",
                "allow_ai_attribution": True,
            },
        ],
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
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

        # validate db records
        all_tracks: List[Track] = session.query(Track).all()
        assert len(all_tracks) == 4

        track_1: Track = (
            session.query(Track)
            .filter(Track.is_current == True, Track.track_id == TRACK_ID_OFFSET)
            .first()
        )
        assert track_1.description == "updated description"
        assert track_1.ai_attribution_user_id == 2
        assert track_1.is_unlisted
        assert track_1.is_delete == True
        assert track_1.duration == 100

        track_2: Track = (
            session.query(Track)
            .filter(
                Track.is_current == True,
                Track.track_id == TRACK_ID_OFFSET + 1,
            )
            .first()
        )
        assert track_2.title == "track 2"
        assert track_2.is_delete == False
        assert track_2.duration == 200
        assert track_2.is_unlisted == False

        track_3: Track = (
            session.query(Track)
            .filter(
                Track.is_current == True,
                Track.track_id == TRACK_ID_OFFSET + 2,
            )
            .first()
        )
        assert track_3.title == "track 3"
        assert track_3.is_delete == False
        assert track_3.is_unlisted == True

        track_4: Track = (
            session.query(Track)
            .filter(
                Track.is_current == True,
                Track.track_id == TRACK_ID_OFFSET + 3,
            )
            .first()
        )
        assert track_4.title == "track 4"
        assert track_4.is_delete == False

        # Check that track routes are updated appropriately
        track_routes = (
            session.query(TrackRoute)
            .filter(TrackRoute.track_id == TRACK_ID_OFFSET)
            .all()
        )
        # Should have the two routes created on track creation as well as two more for the update
        assert len(track_routes) == 2, "Has two total routes after a track name update"
        assert (
            len(
                [
                    route
                    for route in track_routes
                    if route.is_current is True and route.slug == "track-1-2"
                ]
            )
            == 1
        ), "The current route is 'track-1-2'"
        assert (
            len([route for route in track_routes if route.is_current is False]) == 1
        ), "One route is marked non-current"
        assert (
            len(
                [
                    route
                    for route in track_routes
                    if route.slug in ("track-1-2", "track-1")
                ]
            )
            == 2
        ), "Has both of the 'new-style' routes"


def test_index_invalid_tracks(app, mocker):
    "Tests invalid batch of playlists create/update/delete actions"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, None)
    test_metadata = {
        "QmAIDisabled": {"ai_attribution_user_id": 2},
        "QmInvalidUpdateTrack1": {
            "owner_id": 1,
            "track_cid": "some-track-cid",
            "title": "track 1 2",
            "cover_art": None,
            "cover_art_sizes": "QmdxhDiRUC3zQEKqwnqksaSsSSeHiRghjwKzwoRvm77yaZ",
            "tags": "realmagic,rickyreed,theroom",
            "genre": "R&B/Soul",
            "mood": "Empowering",
            "credits_splits": None,
            "created_at": "2020-07-11 08:22:15",
            "create_date": None,
            "updated_at": "2020-07-11 08:22:15",
            "release_date": "2020-07-11 08:22:15",
            "file_type": None,
            "track_segments": [
                {
                    "duration": 6.016,
                    "multihash": "QmabM5svgDgcRdQZaEKSMBCpSZrrYy2y87L8Dx8EQ3T2jp",
                }
            ],
            "has_current_user_reposted": False,
            "is_current": True,
            "is_unlisted": False,
            "is_stream_gated": False,
            "stream_conditions": None,
            "is_download_gated": False,
            "download_conditions": None,
            "field_visibility": {
                "mood": True,
                "tags": True,
                "genre": True,
                "share": True,
                "play_count": True,
                "remixes": True,
            },
            "remix_of": {"tracks": [{"parent_track_id": 75808}]},
            "repost_count": 12,
            "save_count": 21,
            "description": "updated description",
            "license": "All rights reserved",
            "isrc": None,
            "iswc": None,
            "download": {
                "cid": None,
                "is_downloadable": False,
                "requires_follow": False,
            },
            "track_id": 77955,
            "stem_of": None,
            "is_playlist_upload": False,
            "ai_attribution_user_id": 2,
            "orig_file_cid": "original-file-cid",
            "orig_filename": "original-filename",
            "is_downloadable": False,
            "is_original_available": False,
        },
        "QmInvalidUnlistTrack1Update": {"is_unlisted": True},
        "InvalidTrackIdUpdate": {"track_id": 1234, "bogus_field": "bogus"},
    }
    invalid_metadata_json = json.dumps(test_metadata["QmAIDisabled"])
    invalid_update_track1_json = json.dumps(test_metadata["QmInvalidUpdateTrack1"])
    invalid_unlist_track1_json = json.dumps(
        test_metadata["QmInvalidUnlistTrack1Update"]
    )
    invalid_track_id_update = json.dumps(test_metadata["InvalidTrackIdUpdate"])

    tx_receipts = {
        # invalid create
        "CreateTrackBelowOffset": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateTrackUserDoesNotExist": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET + 1,
                        "_entityType": "Track",
                        "_userId": 2,
                        "_action": "Create",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateTrackUserDoesNotMatchSigner": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET + 1,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": "",
                        "_signer": "InvalidWallet",
                    }
                )
            },
        ],
        "CreateTrackAlreadyExists": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateTrackAIDisabled": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET + 1,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmAIDisabled", "data": {invalid_metadata_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateTrackInvalidDeletedApp": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET + 1,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": "",
                        "_signer": "0xdB384D555480214632D08609848BbFB54CCeb76c",
                    }
                )
            },
        ],
        "CreateTrackInvalidRevokedGrant": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET + 1,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": "",
                        "_signer": "0xdB384D555480214632D08609848BbFB54CCeb7AA",
                    }
                )
            },
        ],
        "CreateTrackInvalidWrongUserGrant": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET + 1,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": "",
                        "_signer": "0xdB384D555480214632D08609848BbFB54CCeb7CC",
                    }
                )
            },
        ],
        # invalid updates
        "UpdateTrackInvalidSigner": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": "",
                        "_signer": "InvalidWallet",
                    }
                )
            },
        ],
        "UpdateTrackInvalidOwner": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET,
                        "_entityType": "Track",
                        "_userId": 2,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "QmInvalidUpdateTrack1", "data": {invalid_update_track1_json}}}',
                        "_signer": "User2Wallet",
                    }
                )
            },
        ],
        "UpdateTrackInvalidDeletedApp": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": "",
                        "_signer": "0xdB384D555480214632D08609848BbFB54CCeb76c",
                    }
                )
            },
        ],
        "UpdateTrackInvalidRevokedGrant": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": "",
                        "_signer": "0xdB384D555480214632D08609848BbFB54CCeb7AA",
                    }
                )
            },
        ],
        "UpdateTrackInvalidWrongUserGrant": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": "",
                        "_signer": "0xdB384D555480214632D08609848BbFB54CCeb7CC",
                    }
                )
            },
        ],
        "InvalidTrackUnlist": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "QmInvalidUnlistTrack1Update", "data": {invalid_unlist_track1_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "InvalidTrackIdUpdate": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "InvalidTrackIdUpdate", "data": {invalid_track_id_update}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        # invalid deletes
        "DeleteTrackInvalidSigner": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Delete",
                        "_metadata": "",
                        "_signer": "InvalidWallet",
                    }
                )
            },
        ],
        "DeleteTrackDoesNotExist": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET + 1,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "QmInvalidUpdateTrack1", "data": {invalid_update_track1_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "DeleteTrackInvalidOwner": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET + 1,
                        "_entityType": "Track",
                        "_userId": 2,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "QmInvalidUpdateTrack1", "data": {invalid_update_track1_json}}}',
                        "_signer": "User2Wallet",
                    }
                )
            },
        ],
        "DeleteTrackInvalidDeletedApp": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Delete",
                        "_metadata": "",
                        "_signer": "0xdB384D555480214632D08609848BbFB54CCeb76c",
                    }
                )
            },
        ],
        "DeleteTrackInvalidRevokedGrant": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Delete",
                        "_metadata": "",
                        "_signer": "0xdB384D555480214632D08609848BbFB54CCeb7AA",
                    }
                )
            },
        ],
        "DeleteTrackInvalidWrongUserGrant": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Delete",
                        "_metadata": "",
                        "_signer": "0xdB384D555480214632D08609848BbFB54CCeb7CC",
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
            {"user_id": 2, "handle": "user-1", "wallet": "User2Wallet"},
        ],
        "tracks": [
            {"track_id": TRACK_ID_OFFSET, "owner_id": 1},
        ],
        "developer_apps": [
            {
                "user_id": 2,
                "name": "My App",
                "address": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4C4",
                "is_delete": True,
            },
            {
                "user_id": 2,
                "name": "My App",
                "address": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4ZZ",
            },
        ],
        "grants": [
            {
                "user_id": 1,
                "grantee_address": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4C4",
            },
            {
                "user_id": 1,
                "grantee_address": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4ZZ",
                "is_revoked": True,
            },
            {
                "user_id": 2,
                "grantee_address": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4ZZ",
            },
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

        # validate db records
        all_tracks: List[Track] = session.query(Track).all()
        assert len(all_tracks) == 1
        current_track: List[Track] = (
            session.query(Track).filter(Track.is_current == True).first()
        )
        assert current_track.track_id == TRACK_ID_OFFSET


def test_invalid_track_description(app, mocker):
    "Tests that playlists cant have a description that's too long"
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, None)

    metadata = {
        "CreateInvalidTrackDescriptionMetadata": {
            "owner_id": 1,
            "track_cid": "some-track-cid",
            "title": "track 1",
            "cover_art": None,
            "cover_art_sizes": "QmdxhDiRUC3zQEKqwnqksaSsSSeHiRghjwKzwoRvm77yaZ",
            "tags": "realmagic,rickyreed,theroom",
            "genre": "R&B/Soul",
            "mood": "Empowering",
            "credits_splits": None,
            "created_at": "2020-07-11 08:22:15",
            "create_date": None,
            "updated_at": "2020-07-11 08:22:15",
            "release_date": "2020-07-11 08:22:15",
            "file_type": None,
            "is_playlist_upload": True,
            "track_segments": [
                {
                    "duration": 6.016,
                    "multihash": "QmabM5svgDgcRdQZaEKSMBCpSZrrYy2y87L8Dx8EQ3T2jp",
                }
            ],
            "has_current_user_reposted": False,
            "is_current": True,
            "is_unlisted": False,
            "is_stream_gated": False,
            "stream_conditions": None,
            "is_download_gated": False,
            "download_conditions": None,
            "field_visibility": {
                "mood": True,
                "tags": True,
                "genre": True,
                "share": True,
                "play_count": True,
                "remixes": True,
            },
            "remix_of": {"tracks": [{"parent_track_id": 75808}]},
            "repost_count": 12,
            "save_count": 21,
            "description": "xtralargeplz" * CHARACTER_LIMIT_DESCRIPTION,
            "license": "All rights reserved",
            "isrc": None,
            "iswc": None,
            "download": {
                "cid": None,
                "is_downloadable": False,
                "requires_follow": False,
            },
            "track_id": 77955,
            "stem_of": None,
            "ai_attribution_user_id": 2,
            "orig_file_cid": "original-file-cid",
            "orig_filename": "original-filename",
            "is_downloadable": False,
            "is_original_available": False,
        },
    }

    track_metadata = json.dumps(metadata["CreateInvalidTrackDescriptionMetadata"])

    tx_receipts = {
        "CreateInvalidTrackDescription": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "CreateUserInvalidBioMetadata", "data": {track_metadata}}}',
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
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        total_changes, _ = entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

        assert total_changes == 0
