import logging

import pytest
from integration_tests.utils import populate_mock_db
from src.queries.get_playlists import GetPlaylistsArgs, get_playlists
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


@pytest.fixture
def test_entities():
    return {
        "playlists": [
            {
                "playlist_id": 1,
                "playlist_owner_id": 1,
                "playlist_name": "playlist 1",
            },
            {
                "playlist_id": 2,
                "playlist_owner_id": 2,
                "playlist_name": "playlist 2",
                "is_private": True,
            },
        ],
        "users": [
            {"user_id": 1, "handle": "user1"},
            {"user_id": 2, "handle": "user2"},
        ],
        "playlist_routes": [
            {"slug": "playlist-1", "owner_id": 1, "playlist_id": 1},
            {"slug": "playlist-2", "owner_id": 2, "playlist_id": 2},
        ],
    }


def assert_playlist(playlist, playlist_name, playlist_id, playlist_owner_id):
    assert playlist["playlist_name"] == playlist_name
    assert playlist["playlist_id"] == playlist_id
    assert playlist["playlist_owner_id"] == playlist_owner_id


def test_get_playlist_with_playlist_ids(app, test_entities):
    with app.test_request_context(
        # Request context and args are required for passing
        # pagination info into paginate_query inside get_playlists
        data={"limit": 5, "offset": 3},
    ):
        db = get_db()
        populate_mock_db(db, test_entities)
        with db.scoped_session():
            playlist = get_playlists(
                GetPlaylistsArgs(
                    current_user_id=2,
                    playlist_ids=[2],
                ),
            )

            assert len(playlist) == 1
            assert_playlist(
                playlist=playlist[0],
                playlist_id=2,
                playlist_name="playlist 2",
                playlist_owner_id=2,
            )


def test_get_playlist_with_permalink(app, test_entities):
    with app.test_request_context(
        # Request context and args are required for passing
        # pagination info into paginate_query inside get_playlists
        data={"limit": 5, "offset": 3},
    ):
        db = get_db()
        populate_mock_db(db, test_entities)
        with db.scoped_session():
            playlist = get_playlists(
                GetPlaylistsArgs(
                    current_user_id=1,
                    routes=[{"handle": "user1", "slug": "playlist-1"}],
                ),
            )

            playlist_from_other_user = get_playlists(
                GetPlaylistsArgs(
                    current_user_id=2,
                    routes=[{"handle": "user1", "slug": "playlist-1"}],
                ),
            )
            assert len(playlist) == 1
            assert len(playlist_from_other_user) == 1
            assert playlist_from_other_user == playlist
            assert_playlist(
                playlist=playlist[0],
                playlist_id=1,
                playlist_name="playlist 1",
                playlist_owner_id=1,
            )


def test_get_playlist_with_permalink_private_playlist(app, test_entities):
    with app.test_request_context(
        # Request context and args are required for passing
        # pagination info into paginate_query inside get_playlists
        data={"limit": 5, "offset": 3},
    ):
        db = get_db()
        populate_mock_db(db, test_entities)
        with db.scoped_session():
            playlist = get_playlists(
                GetPlaylistsArgs(
                    current_user_id=1,
                    routes=[{"handle": "user2", "slug": "playlist-2"}],
                ),
            )
            assert len(playlist) == 0
