import logging
from typing import List

from integration_tests.utils import populate_mock_db
from src.models.playlists.aggregate_playlist import AggregatePlaylist
from src.models.tracks.aggregate_track import AggregateTrack
from src.models.tracks.track import Track
from src.models.users.aggregate_user import AggregateUser
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


basic_entities = {
    "users": [
        {"user_id": 1, "handle": "user1"},
        {"user_id": 2, "handle": "user2"},
    ],
    "tracks": [
        {"track_id": 1, "owner_id": 1},
        {"track_id": 2, "owner_id": 2},
        {"track_id": 3, "owner_id": 2},
        {"track_id": 4, "owner_id": 2, "is_unlisted": True},
    ],
    "playlists": [
        {
            "playlist_id": 1,
            "playlist_owner_id": 1,
            "is_album": False,
            "playlist_contents": {
                "track_ids": [
                    {"track": 1, "time": 1},
                ]
            },
        },
        {
            "playlist_id": 2,
            "playlist_owner_id": 1,
            "is_album": False,
            "is_private": True,
            "playlist_contents": {
                "track_ids": [
                    {"track": 1, "time": 1},
                ]
            },
        },
        {
            "playlist_id": 3,
            "playlist_owner_id": 1,
            "is_album": True,
            "playlist_contents": {
                "track_ids": [
                    {"track": 1, "time": 1},
                    {"track": 2, "time": 2},
                ]
            },
        },
    ],
}
test_social_feature_entities = {
    "follows": [
        {
            "follower_user_id": 1,
            "followee_user_id": 2,
        }
    ],
    "reposts": [
        {"repost_item_id": 1, "repost_type": "track", "user_id": 2},
        {"repost_item_id": 1, "repost_type": "playlist", "user_id": 2},
        {"repost_item_id": 3, "repost_type": "album", "user_id": 2},
        {"repost_item_id": 3, "repost_type": "album", "user_id": 1},
    ],
    "saves": [
        {"save_item_id": 1, "save_type": "track", "user_id": 2},
    ],
}


def test_aggregate_counters(app):
    with app.app_context():
        db = get_db()

    populate_mock_db(db, basic_entities)
    populate_mock_db(db, test_social_feature_entities)

    with db.scoped_session() as session:
        agg_users: List[AggregateUser] = (
            session.query(AggregateUser).order_by(AggregateUser.user_id).all()
        )

        compare_rows(
            agg_users[0],
            AggregateUser(
                user_id=1,
                track_count=1,
                playlist_count=1,
                album_count=1,
                follower_count=0,
                following_count=1,
                repost_count=1,
                track_save_count=0,
                supporter_count=0,
                supporting_count=0,
                dominant_genre=None,
                dominant_genre_count=0,
            ),
        )

        compare_rows(
            agg_users[1],
            AggregateUser(
                user_id=2,
                track_count=2,
                playlist_count=0,
                album_count=0,
                follower_count=1,
                following_count=0,
                repost_count=3,
                track_save_count=1,
                supporter_count=0,
                supporting_count=0,
                dominant_genre=None,
                dominant_genre_count=0,
            ),
        )

        # tracks
        agg_tracks: List[AggregateTrack] = (
            session.query(AggregateTrack).order_by(AggregateTrack.track_id).all()
        )
        compare_rows(
            agg_tracks[0], AggregateTrack(track_id=1, repost_count=1, save_count=1)
        )
        compare_rows(
            agg_tracks[1], AggregateTrack(track_id=2, repost_count=0, save_count=0)
        )

        # is_available is update in place
        track: Track = (
            session.query(Track)
            .filter(Track.track_id == 2)
            .filter(Track.is_current == True)
            .first()
        )
        assert track.is_available == True
        track.is_available = False
        session.add(track)
        session.flush()
        session.refresh(track)
        assert track.is_available == False

        # check that agg_user track count is updated
        # must call refresh to avoid sqlalchemy object cache
        owner_agg: AggregateUser = session.query(AggregateUser).get(track.owner_id)
        session.refresh(owner_agg)
        assert owner_agg.track_count == 1

        # change track from unlisted to public
        # should increment agg user track count
        # I tried to simulate update is_current -> false + insert new row
        # but couldn't figure out how to make sqlalchemy do it
        # so just do an in place update, since the trigger will treat it the same
        track: Track = (
            session.query(Track)
            .filter(Track.track_id == 4)
            .filter(Track.is_current == True)
            .first()
        )
        assert track.is_unlisted == True
        track.is_unlisted = False
        session.add(track)
        session.flush()
        session.refresh(track)
        assert track.is_unlisted == False

        # check that agg_user track count is updated
        owner_agg: AggregateUser = session.query(AggregateUser).get(track.owner_id)
        session.refresh(owner_agg)
        assert owner_agg.track_count == 2

        # playlists
        agg_playlists: List[AggregatePlaylist] = (
            session.query(AggregatePlaylist)
            .order_by(AggregatePlaylist.playlist_id)
            .all()
        )
        compare_rows(
            agg_playlists[0],
            AggregatePlaylist(
                playlist_id=1, is_album=False, repost_count=1, save_count=0
            ),
        )
        compare_rows(
            agg_playlists[2],
            AggregatePlaylist(
                playlist_id=3, is_album=True, repost_count=2, save_count=0
            ),
        )


def compare_rows(a, b):
    assert str(a) == str(b)
