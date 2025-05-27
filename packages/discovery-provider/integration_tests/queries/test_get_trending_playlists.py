import logging
from time import time

from integration_tests.utils import populate_mock_db
from src.queries.get_trending_playlists import _get_trending_playlists_with_session
from src.trending_strategies.pnagD_trending_playlists_strategy import (
    TrendingPlaylistsStrategypnagD,
)
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


def test_get_trending_playlists(app):
    """Tests that we can get trending playlists"""
    with app.app_context():
        db = get_db()

    test_entities = {
        "playlists": [
            {
                "playlist_id": 1,
                "playlist_owner_id": 1,
                "playlist_name": "playlist 1",
                "description": "playlist 1",
                "playlist_contents": {
                    "track_ids": [
                        {"track": 1, "time": round(time() * 1000)},
                        {"track": 2, "time": round(time() * 1000)},
                        {"track": 3, "time": round(time() * 1000)},
                        {"track": 4, "time": round(time() * 1000)},
                        {"track": 5, "time": round(time() * 1000)},
                        {"track": 6, "time": round(time() * 1000)},
                    ]
                },
            },
            {
                "playlist_id": 2,
                "playlist_owner_id": 2,
                "playlist_name": "playlist 2",
                "description": "playlist 2",
                "playlist_contents": {
                    "track_ids": [
                        {"track": 5, "time": round(time() * 1000)},
                        {"track": 6, "time": round(time() * 1000)},
                        {"track": 7, "time": round(time() * 1000)},
                        {"track": 8, "time": round(time() * 1000)},
                    ]
                },
            },
        ],
        "playlist_trending_scores": [
            {"playlist_id": 1, "score": 100},
            {"playlist_id": 2, "score": 200},
        ],
        "users": [
            {"user_id": 1},
            {"user_id": 2},
            {"user_id": 3},
            {"user_id": 4},
            {"user_id": 5},
        ],
        "tracks": [
            {"track_id": 1, "owner_id": 1},
            {"track_id": 2, "owner_id": 1},
            {"track_id": 3, "owner_id": 1},
            {"track_id": 4, "owner_id": 2},
            {"track_id": 5, "owner_id": 3},
            {"track_id": 6, "owner_id": 4},
            {"track_id": 7, "owner_id": 5},
            {"track_id": 8, "owner_id": 5},
        ],
    }

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        res = _get_trending_playlists_with_session(
            session,
            {"time": "week", "offset": 0, "limit": 10},
            TrendingPlaylistsStrategypnagD(),
            use_request_context=False,
        )
        # Playlists are sorted by score
        assert res[0]["playlist_id"] == 2
        assert res[1]["playlist_id"] == 1


def test_get_trending_playlists_filters(app):
    """Tests that invalid playlists are filtered"""
    with app.app_context():
        db = get_db()

    test_entities = {
        "playlists": [
            # Playlist 1 is an album
            {
                "playlist_id": 1,
                "playlist_owner_id": 1,
                "playlist_name": "playlist 1",
                "description": "playlist 1",
                "is_album": True,
                "playlist_contents": {
                    "track_ids": [
                        {"track": 1, "time": round(time() * 1000)},
                        {"track": 2, "time": round(time() * 1000)},
                        {"track": 3, "time": round(time() * 1000)},
                        {"track": 4, "time": round(time() * 1000)},
                        {"track": 5, "time": round(time() * 1000)},
                    ]
                },
            },
            # Playlist 2 is hidden
            {
                "playlist_id": 2,
                "playlist_owner_id": 2,
                "playlist_name": "playlist 2",
                "description": "playlist 2",
                "is_private": True,
                "playlist_contents": {
                    "track_ids": [
                        {"track": 5, "time": round(time() * 1000)},
                        {"track": 6, "time": round(time() * 1000)},
                        {"track": 7, "time": round(time() * 1000)},
                        {"track": 8, "time": round(time() * 1000)},
                    ]
                },
            },
            # Playlist 3 is deleted
            {
                "playlist_id": 3,
                "playlist_owner_id": 3,
                "playlist_name": "playlist 3",
                "is_delete": True,
                "playlist_contents": {
                    "track_ids": [
                        {"track": 5, "time": round(time() * 1000)},
                        {"track": 6, "time": round(time() * 1000)},
                        {"track": 7, "time": round(time() * 1000)},
                        {"track": 8, "time": round(time() * 1000)},
                    ]
                },
            },
        ],
        "playlist_trending_scores": [
            {"playlist_id": 1, "score": 100},
            {"playlist_id": 2, "score": 200},
            {"playlist_id": 3, "score": 300},
        ],
        "users": [
            {"user_id": 1},
            {"user_id": 2},
            {"user_id": 3},
            {"user_id": 4},
            {"user_id": 5},
        ],
        "tracks": [
            {"track_id": 1, "owner_id": 1},
            {"track_id": 2, "owner_id": 1},
            {"track_id": 3, "owner_id": 1},
            {"track_id": 4, "owner_id": 2},
            {"track_id": 5, "owner_id": 3},
            {"track_id": 6, "owner_id": 4},
            {"track_id": 7, "owner_id": 5},
            {"track_id": 8, "owner_id": 5},
        ],
    }

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        res = _get_trending_playlists_with_session(
            session,
            {"time": "week", "offset": 0, "limit": 10},
            TrendingPlaylistsStrategypnagD(),
            use_request_context=False,
        )
        # No results, all filtered
        assert len(res) == 0
