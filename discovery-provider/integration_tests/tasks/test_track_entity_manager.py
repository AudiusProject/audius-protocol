from typing import List

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.challenges.challenge_event_bus import ChallengeEventBus, setup_challenge_bus
from src.models.tracks.track import Track
from src.models.tracks.track_route import TrackRoute
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.types import TRACK_ID_OFFSET
from src.utils.db_session import get_db
from web3 import Web3
from web3.datastructures import AttributeDict


def test_index_valid_track(app, mocker):
    "Tests valid batch of tracks create/update/delete actions"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        challenge_event_bus: ChallengeEventBus = setup_challenge_bus()
        update_task = UpdateTask(None, web3, challenge_event_bus)

    tx_receipts = {
        "CreateTrack1Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": TRACK_ID_OFFSET,
                        "_entityType": "Track",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": "QmCreateTrack1",
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
                        "_metadata": "QmUpdateTrack1",
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
                        "_metadata": "QmCreateTrack2",
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
    test_metadata = {
        "QmCreateTrack1": {
            "owner_id": 1,
            "title": "track 1",
            "length": None,
            "cover_art": None,
            "cover_art_sizes": "QmdxhDiRUC3zQEKqwnqksaSsSSeHiRghjwKzwoRvm77yaZ",
            "tags": "realmagic,rickyreed,theroom",
            "genre": "R&B/Soul",
            "mood": "Empowering",
            "credits_splits": None,
            "created_at": "2020-07-11 08:22:15",
            "create_date": None,
            "updated_at": "2020-07-11 08:22:15",
            "release_date": "Sat Jul 11 2020 01:19:58 GMT-0700",
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
        },
        "QmCreateTrack2": {
            "owner_id": 1,
            "title": "track 2",
            "length": None,
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
        },
        "QmUpdateTrack1": {
            "owner_id": 1,
            "title": "track 1 2",
            "length": None,
            "cover_art": None,
            "cover_art_sizes": "QmdxhDiRUC3zQEKqwnqksaSsSSeHiRghjwKzwoRvm77yaZ",
            "tags": "realmagic,rickyreed,theroom",
            "genre": "R&B/Soul",
            "mood": "Empowering",
            "credits_splits": None,
            "created_at": "2020-07-11 08:22:15",
            "create_date": None,
            "updated_at": "2020-07-11 08:22:15",
            "release_date": "Sat Jul 11 2020 01:19:58 GMT-0700",
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
        },
    }

    entities = {
        "users": [
            {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
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

        # validate db records
        all_tracks: List[Track] = session.query(Track).all()
        assert len(all_tracks) == 4

        track_1: Track = (
            session.query(Track)
            .filter(Track.is_current == True, Track.track_id == TRACK_ID_OFFSET)
            .first()
        )
        assert track_1.description == "updated description"
        assert track_1.is_delete == True

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
        update_task = UpdateTask(None, web3, None)

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
                        "_metadata": "",
                        "_signer": "User2Wallet",
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
                        "_metadata": "",
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
                        "_metadata": "",
                        "_signer": "User2Wallet",
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
            {"user_id": 2, "handle": "user-1", "wallet": "User2Wallet"},
        ],
        "tracks": [
            {"track_id": TRACK_ID_OFFSET, "owner_id": 1},
        ],
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
            ipfs_metadata={},
        )

        # validate db records
        all_tracks: List[Track] = session.query(Track).all()
        assert len(all_tracks) == 1  # no new playlists indexed
