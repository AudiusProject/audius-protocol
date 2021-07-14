from datetime import datetime

from src.queries.get_tracks import _get_tracks, get_tracks_by_routes
from src.utils.db_session import get_db
from tests.utils import populate_mock_db


def populate_tracks(db):
    test_entities = {
        "tracks": [
            {
                "track_id": 1,
                "owner_id": 1287289,
                "release_date": "Fri Dec 20 2019 12:00:00 GMT-0800",
                "created_at": datetime(2018, 5, 17),
            },
            {"track_id": 2, "owner_id": 1287289, "created_at": datetime(2018, 5, 18)},
            {
                "track_id": 3,
                "owner_id": 1287289,
                "release_date": "Wed Dec 18 2019 12:00:00 GMT-0800",
                "created_at": datetime(2020, 5, 17),
            },
            {
                "track_id": 4,
                "owner_id": 1287289,
                "release_date": "",
                "created_at": datetime(2018, 5, 19),
            },
            {
                "track_id": 5,
                "owner_id": 1287289,
                "release_date": "garbage-should-not-parse",
                "created_at": datetime(2018, 5, 20),
            },
            {
                "track_id": 6,
                "owner_id": 4,
                "release_date": "Wed Dec 18 2019 12:00:00 GMT-0800",
                "created_at": datetime(2020, 5, 17)
            },
            {
                "track_id": 7,
                "owner_id": 4,
                "release_date": "",
                "created_at": datetime(2018, 5, 19)
            },
            {
                "track_id": 8,
                "owner_id": 4,
                "release_date": "garbage-should-not-parse",
                "created_at": datetime(2018, 5, 20)
            },
        ],
        'track_routes': [
            {
                "slug": "track-1",
                "owner_id": 1287289
            },
            {
                "slug": "track-2",
                "owner_id": 1287289
            },
            {
                "slug": "different-track",
                "owner_id": 4,
                "track_id": 6,
            },
            {
                "slug": "track-1",
                "owner_id": 4,
                "track_id": 7,
            },
            {
                "slug": "track-2",
                "owner_id": 4,
                "track_id": 8,
            },
        ],
        'users': [
            {"user_id": 1287289, "handle": "some-test-user"},
            {"user_id": 4, "handle": "some-other-user"}
        ]
    }

    populate_mock_db(db, test_entities)


def test_get_tracks_by_date(app):
    """Test getting tracks ordering by date"""

    with app.app_context():
        db = get_db()

    populate_tracks(db)

    with db.scoped_session() as session:
        tracks = _get_tracks(
            session, {"user_id": 1287289, "offset": 0, "limit": 10, "sort": "date"}
        )

        assert len(tracks) == 5
        assert tracks[0]["track_id"] == 1
        assert tracks[1]["track_id"] == 3
        assert tracks[2]["track_id"] == 5
        assert tracks[3]["track_id"] == 4
        assert tracks[4]["track_id"] == 2


def test_get_tracks_by_slugs(app):
    """Test getting tracks by their slug for route resolution"""
    with app.app_context():
        db = get_db()

        populate_tracks(db)

        routes = [
            {"slug": "track-1", "handle": "some-test-user"},
            {"slug": "different-track", "handle": "some-other-user"},
            {"slug": "track-1", "handle": "some-other-user"},
            {"slug": "track-2", "handle": "some-other-user"}
        ]
        tracks = get_tracks_by_routes(routes)

        assert len(tracks) == 4
