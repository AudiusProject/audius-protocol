import json
from datetime import datetime
from typing import List

import pytest
from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.models.playlists.playlist import Playlist
from src.models.playlists.playlist_route import PlaylistRoute
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.utils import PLAYLIST_ID_OFFSET
from src.utils.db_session import get_db
from web3 import Web3
from web3.datastructures import AttributeDict


@pytest.fixture()
def tx_receipts():
    test_metadata = {
        "QmCreatePlaylist1": {
            "playlist_contents": {"track_ids": []},
            "description": "",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "playlist 1",
        },
        "QmCreatePlaylist2": {
            "playlist_contents": {"track_ids": []},
            "description": "test description",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "playlist 2",
        },
        "QmCreatePlaylist4": {
            "playlist_contents": {"track_ids": []},
            "description": "",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "playlist 4",
        },
        "QmUpdatePlaylist1": {
            "playlist_contents": {"track_ids": [{"time": 1660927554, "track": 1}]},
            "description": "",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "playlist 1 updated",
        },
        "QmUpdatePlaylist3": {
            "playlist_contents": {"track_ids": []},
            "description": "",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "playlist 3 updated",
        },
        "QmCreateAlbum4": {
            "playlist_contents": {"track_ids": [{"time": 1660927554, "track": 1}]},
            "description": "",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "album",
            "is_album": True,
        },
    }

    create_playlist1_json = json.dumps(test_metadata["QmCreatePlaylist1"])
    create_playlist2_json = json.dumps(test_metadata["QmCreatePlaylist2"])
    create_playlist4_json = json.dumps(test_metadata["QmCreatePlaylist4"])
    update_playlist1_json = json.dumps(test_metadata["QmUpdatePlaylist1"])
    update_playlist3_json = json.dumps(test_metadata["QmUpdatePlaylist3"])
    create_album4_json = json.dumps(test_metadata["QmCreateAlbum4"])

    return {
        "CreatePlaylist1Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreatePlaylist1", "data": {create_playlist1_json}}}',
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
                        "_metadata": f'{{"cid": "QmUpdatePlaylist1", "data": {update_playlist1_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "DeletePlaylist1Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Delete",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreatePlaylist2Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 1,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreatePlaylist2", "data": {create_playlist2_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "UpdatePlaylist3Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 2,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "QmUpdatePlaylist3", "data": {update_playlist3_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateAlbumTx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 3,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreateAlbum4", "data": {create_album4_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreatePlaylist4Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 4,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreatePlaylist4", "data": {create_playlist4_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }


@pytest.fixture()
def tx_receipts_update_routes():
    test_metadata = {
        "QmCreatePlaylist1": {
            "playlist_contents": {"track_ids": []},
            "description": "",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "my playlist~’",
        },
        "QmCreatePlaylist2": {
            "playlist_contents": {"track_ids": []},
            "description": "test description",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "my playlist 2",
        },
        "QmCreatePlaylist3": {
            "playlist_contents": {"track_ids": []},
            "description": "test description",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "my playlist!!",
        },
        "QmCreatePlaylist4": {
            "playlist_contents": {"track_ids": []},
            "description": "test description",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "my ~playlist!!",
        },
        # only updating track, should not insert new slug row
        "QmUpdatePlaylist1": {
            "playlist_contents": {"track_ids": [{"time": 1660927554, "track": 1}]},
            "description": "",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "my playlist",
        },
        "QmUpdatePlaylist12": {
            "playlist_contents": {"track_ids": []},
            "description": "",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "my playlist 1 w/ new name!",
        },
        "QmCreatePlaylistDiffOwner": {
            "playlist_contents": {"track_ids": []},
            "description": "test desc",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "my playlist",
        },
    }

    create_playlist1_json = json.dumps(test_metadata["QmCreatePlaylist1"])
    create_playlist2_json = json.dumps(test_metadata["QmCreatePlaylist2"])
    create_playlist3_json = json.dumps(test_metadata["QmCreatePlaylist3"])
    create_playlist4_json = json.dumps(test_metadata["QmCreatePlaylist4"])
    update_playlist1_json = json.dumps(test_metadata["QmUpdatePlaylist1"])
    update_playlist12_json = json.dumps(test_metadata["QmUpdatePlaylist12"])
    create_playlist_diff_owner_json = json.dumps(
        test_metadata["QmCreatePlaylistDiffOwner"]
    )

    return {
        "CreatePlaylist1Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreatePlaylist1", "data": {create_playlist1_json}}}',
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
                        "_metadata": f'{{"cid": "QmUpdatePlaylist1", "data": {update_playlist1_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "UpdatePlaylist12Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "QmUpdatePlaylist12", "data": {update_playlist12_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreatePlaylist2Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 1,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreatePlaylist2", "data": {create_playlist2_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreatePlaylist3Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 4,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreatePlaylist3", "data": {create_playlist3_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreatePlaylist4Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 5,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreatePlaylist4", "data": {create_playlist4_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreatePlaylistDiffOwnerTx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 6,
                        "_entityType": "Playlist",
                        "_userId": 2,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreateDiffOwner", "data": {create_playlist_diff_owner_json}}}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
    }


def assert_playlist_route(
    route, slug, title_slug, collision_id, owner_id, playlist_id, is_current
):
    assert route.slug == slug
    assert route.title_slug == title_slug
    assert route.collision_id == collision_id
    assert route.owner_id == owner_id
    assert route.playlist_id == playlist_id
    assert route.is_current == is_current


def test_index_valid_playlists_updates_routes(app, mocker, tx_receipts_update_routes):
    "Tests valid batch of playlists create/update/delete actions"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, None)

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.toBytes(text=tx_receipt)})
        for tx_receipt in tx_receipts_update_routes
    ]

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts_update_routes[tx_receipt.transactionHash.decode("utf-8")]

    mocker.patch(
        "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
        side_effect=get_events_side_effect,
        autospec=True,
    )

    entities = {
        "users": [
            {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
            {"user_id": 2, "handle": "user-2", "wallet": "user2wallet"},
        ],
        "playlists": [],
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
        )

        # validate db records
        playlist_routes = session.query(PlaylistRoute).all()
        assert len(playlist_routes) == 6
        playlist_1_route_current = next(
            (
                route
                for route in playlist_routes
                if route.playlist_id == PLAYLIST_ID_OFFSET and route.is_current
            ),
            None,
        )
        playlist_1_route_not_current = next(
            (
                route
                for route in playlist_routes
                if route.playlist_id == PLAYLIST_ID_OFFSET and not route.is_current
            ),
            None,
        )
        playlist_2_route = next(
            (
                route
                for route in playlist_routes
                if route.playlist_id == PLAYLIST_ID_OFFSET + 1
            ),
            None,
        )
        playlist_3_route = next(
            (
                route
                for route in playlist_routes
                if route.playlist_id == PLAYLIST_ID_OFFSET + 4
            ),
            None,
        )
        playlist_4_route = next(
            (
                route
                for route in playlist_routes
                if route.playlist_id == PLAYLIST_ID_OFFSET + 5
            ),
            None,
        )
        playlist_diff_owner_route = next(
            (
                route
                for route in playlist_routes
                if route.playlist_id == PLAYLIST_ID_OFFSET + 6
            ),
            None,
        )
        # Though we updated the playlist 3 times,
        # we only updated the name to have a diff slug two times
        assert_playlist_route(
            route=playlist_1_route_current,
            slug="my-playlist-1-w-new-name",
            title_slug="my-playlist-1-w-new-name",
            collision_id=0,
            owner_id=1,
            playlist_id=PLAYLIST_ID_OFFSET,
            is_current=True,
        )
        assert_playlist_route(
            route=playlist_1_route_not_current,
            slug="my-playlist",
            title_slug="my-playlist",
            collision_id=0,
            owner_id=1,
            playlist_id=PLAYLIST_ID_OFFSET,
            is_current=False,
        )
        assert_playlist_route(
            route=playlist_2_route,
            slug="my-playlist-2",
            title_slug="my-playlist-2",
            collision_id=0,
            owner_id=1,
            playlist_id=PLAYLIST_ID_OFFSET + 1,
            is_current=True,
        )
        assert_playlist_route(
            route=playlist_3_route,
            slug="my-playlist-1",
            title_slug="my-playlist",
            collision_id=1,
            owner_id=1,
            is_current=True,
            playlist_id=PLAYLIST_ID_OFFSET + 4,
        )
        assert_playlist_route(
            route=playlist_4_route,
            slug="my-playlist-3",
            title_slug="my-playlist",
            collision_id=3,
            playlist_id=PLAYLIST_ID_OFFSET + 5,
            owner_id=1,
            is_current=True,
        )
        assert_playlist_route(
            route=playlist_diff_owner_route,
            slug="my-playlist",
            title_slug="my-playlist",
            collision_id=0,
            playlist_id=PLAYLIST_ID_OFFSET + 6,
            owner_id=2,
            is_current=True,
        )


def test_index_valid_playlists(app, mocker, tx_receipts):
    "Tests valid batch of playlists create/update/delete actions"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, None)

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
        ],
        "playlists": [
            {
                "playlist_id": PLAYLIST_ID_OFFSET + 2,
                "playlist_owner_id": 1,
                "playlist_name": "playlist 3",
            }
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
        )

        # validate db records
        all_playlists: List[Playlist] = session.query(Playlist).all()
        assert len(all_playlists) == 8

        playlists_1: List[Playlist] = (
            session.query(Playlist)
            .filter(
                Playlist.is_current == True, Playlist.playlist_id == PLAYLIST_ID_OFFSET
            )
            .all()
        )
        assert len(playlists_1) == 1
        playlist_1 = playlists_1[0]
        assert datetime.timestamp(playlist_1.last_added_to) == 1585336422
        assert playlist_1.playlist_name == "playlist 1 updated"
        assert playlist_1.is_delete == True
        assert playlist_1.is_current == True

        playlists_2: List[Playlist] = (
            session.query(Playlist)
            .filter(
                Playlist.is_current == True,
                Playlist.playlist_id == PLAYLIST_ID_OFFSET + 1,
            )
            .all()
        )
        assert len(playlists_2) == 1
        playlist_2 = playlists_2[0]
        assert playlist_2.last_added_to == None
        assert playlist_2.playlist_name == "playlist 2"
        assert playlist_2.is_delete == False
        assert playlist_2.is_current == True

        playlists_3: List[Playlist] = (
            session.query(Playlist)
            .filter(
                Playlist.is_current == True,
                Playlist.playlist_id == PLAYLIST_ID_OFFSET + 2,
            )
            .all()
        )
        assert len(playlists_3) == 1
        playlist_3 = playlists_3[0]
        assert playlist_3.last_added_to == None
        assert playlist_3.playlist_name == "playlist 3 updated"
        assert playlist_3.is_delete == False
        assert playlist_3.is_current == True

        playlists_4: List[Playlist] = (
            session.query(Playlist)
            .filter(
                Playlist.is_current == True,
                Playlist.playlist_id == PLAYLIST_ID_OFFSET + 4,
            )
            .all()
        )
        assert len(playlists_4) == 1
        playlist_4 = playlists_4[0]
        assert playlist_4.last_added_to == None
        assert playlist_4.playlist_name == "playlist 4"
        assert playlist_4.is_delete == False
        assert playlist_4.is_current == True

        albums: List[Playlist] = (
            session.query(Playlist)
            .filter(Playlist.is_current == True, Playlist.is_album == True)
            .all()
        )
        assert len(albums) == 1
        album = albums[0]
        assert datetime.timestamp(album.last_added_to) == 1585336422
        assert album.playlist_name == "album"
        assert album.is_delete == False
        assert album.is_current == True


def test_index_invalid_playlists(app, mocker):
    "Tests invalid batch of playlists create/update/delete actions"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, None)

    tx_receipts = {
        # invalid create
        "CreatePlaylistBelowOffset": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreatePlaylistUserDoesNotExist": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 1,
                        "_entityType": "Playlist",
                        "_userId": 2,
                        "_action": "Create",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreatePlaylistUserDoesNotMatchSigner": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 2,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": "",
                        "_signer": "InvalidWallet",
                    }
                )
            },
        ],
        "CreatePlaylistAlreadyExists": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        # invalid updates
        "UpdatePlaylistInvalidSigner": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": "",
                        "_signer": "InvalidWallet",
                    }
                )
            },
        ],
        "UpdatePlaylistInvalidOwner": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 2,
                        "_action": "Update",
                        "_metadata": "",
                        "_signer": "User2Wallet",
                    }
                )
            },
        ],
        # invalid deletes
        "DeletePlaylistInvalidSigner": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Delete",
                        "_metadata": "",
                        "_signer": "InvalidWallet",
                    }
                )
            },
        ],
        "DeletePlaylistDoesNotExist": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 1,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "DeletePlaylistInvalidOwner": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 1,
                        "_entityType": "Playlist",
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
        "playlists": [
            {"playlist_id": PLAYLIST_ID_OFFSET, "playlist_owner_id": 1},
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
        )

        # validate db records
        all_playlists: List[Playlist] = session.query(Playlist).all()
        assert len(all_playlists) == 1  # no new playlists indexed
        assert all_playlists[0].is_current == True
