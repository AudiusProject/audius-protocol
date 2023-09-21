import logging
from typing import List

from src.models.playlists.aggregate_playlist import AggregatePlaylist
from src.models.tracks.aggregate_track import AggregateTrack
from src.models.users.aggregate_user import AggregateUser
from src.tasks.update_aggregates import _update_aggregates
from src.utils.db_session import get_db
from tests.utils import populate_mock_db

logger = logging.getLogger(__name__)


# Tests
def test_update_aggregate_track(app):
    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = {
        "tracks": [
            {"track_id": 1, "title": "track 1", "owner_id": 1},
        ],
        "user": [{"user_id": 1}, {"user_id": 2}],
        "saves": [{"user_id": 2, "save_item_id": 1}],
        "reposts": [
            {"user_id": 2, "repost_item_id": 1, "is_current": False},
            {"user_id": 2, "repost_item_id": 1, "is_delete": True, "is_current": False},
            {"user_id": 2, "repost_item_id": 1, "is_current": True},
        ],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        # verify triggers work
        aggregate_track = session.query(AggregateTrack).filter_by(track_id=1).first()
        assert aggregate_track.track_id == 1
        assert aggregate_track.repost_count == 1
        assert aggregate_track.save_count == 1

        aggregate_track.repost_count = 0
        aggregate_track.save_count = 0

    with db.scoped_session() as session:
        _update_aggregates(session)

        aggregate_track = session.query(AggregateTrack).filter_by(track_id=1).first()
        assert aggregate_track.track_id == 1
        assert aggregate_track.repost_count == 1
        assert aggregate_track.save_count == 1


def test_update_aggregate_playlist(app):
    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = {
        "playlists": [
            {"playlist_id": 1, "playlist_owner_id": 1},
            {
                "playlist_id": 2,
                "playlist_owner_id": 1,
                "is_private": True,
            },
        ],
        "user": [{"user_id": 1}, {"user_id": 2}],
    }
    social_feature_entities = {
        "saves": [{"user_id": 2, "save_item_id": 1, "save_type": "playlist"}],
        "reposts": [
            {
                "user_id": 2,
                "repost_item_id": 1,
                "is_current": False,
                "repost_type": "playlist",
            },
            {
                "user_id": 2,
                "repost_item_id": 1,
                "is_delete": True,
                "is_current": False,
                "repost_type": "playlist",
            },
            {
                "user_id": 2,
                "repost_item_id": 1,
                "is_current": True,
                "repost_type": "playlist",
            },
        ],
    }

    populate_mock_db(db, entities)
    populate_mock_db(db, social_feature_entities)

    with db.scoped_session() as session:
        # verify triggers work
        aggregate_playlist_all: List[AggregatePlaylist] = (
            session.query(AggregatePlaylist)
            .order_by(AggregatePlaylist.playlist_id)
            .all()
        )

        assert len(aggregate_playlist_all) == 2
        aggregate_playlist = (
            session.query(AggregatePlaylist).filter_by(playlist_id=1).first()
        )
        assert aggregate_playlist.playlist_id == 1
        assert aggregate_playlist.repost_count == 1
        assert aggregate_playlist.save_count == 1

        aggregate_playlist.repost_count = 0
        aggregate_playlist.save_count = 0

    with db.scoped_session() as session:
        _update_aggregates(session)

        aggregate_playlist = (
            session.query(AggregatePlaylist).filter_by(playlist_id=1).first()
        )
        assert aggregate_playlist.playlist_id == 1
        assert aggregate_playlist.repost_count == 1
        assert aggregate_playlist.save_count == 1


def test_update_aggregate_user(app):
    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = {
        "playlists": [
            {"playlist_id": 1, "playlist_owner_id": 1},
            {"playlist_id": 2, "playlist_owner_id": 1, "is_album": True},
            {"playlist_id": 3, "playlist_owner_id": 2},
        ],
        "tracks": [{"track_id": 1, "owner_id": 1}, {"track_id": 2, "owner_id": 2}],
        "user": [{"user_id": 1}, {"user_id": 2}],
        "follows": [
            {"follower_user_id": 1, "followee_user_id": 2},
            {"follower_user_id": 2, "followee_user_id": 1},
        ],
        "saves": [
            {"user_id": 1, "save_item_id": 2, "save_type": "track"},
            {"user_id": 1, "save_item_id": 3, "save_type": "playlist"},
        ],
        "reposts": [
            {
                "user_id": 1,
                "repost_item_id": 2,
                "is_current": True,
                "repost_type": "track",
            },
        ],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        # verify triggers work
        aggregate_user = session.query(AggregateUser).filter_by(user_id=1).first()
        assert aggregate_user.user_id == 1
        assert aggregate_user.track_count == 1
        assert aggregate_user.playlist_count == 1
        assert aggregate_user.album_count == 1
        assert aggregate_user.follower_count == 1
        assert aggregate_user.following_count == 1
        assert aggregate_user.repost_count == 1
        assert aggregate_user.track_save_count == 1

        aggregate_user.track_count = 0
        aggregate_user.playlist_count = 0
        aggregate_user.album_count = 0
        aggregate_user.follower_count = 0
        aggregate_user.following_count = 0
        aggregate_user.repost_count = 0
        aggregate_user.track_save_count = 0

    with db.scoped_session() as session:
        _update_aggregates(session)

        aggregate_user = session.query(AggregateUser).filter_by(user_id=1).first()
        assert aggregate_user.user_id == 1
        assert aggregate_user.track_count == 1
        assert aggregate_user.playlist_count == 1
        assert aggregate_user.album_count == 1
        assert aggregate_user.follower_count == 1
        assert aggregate_user.following_count == 1
        assert aggregate_user.repost_count == 1
        assert aggregate_user.track_save_count == 1
