from datetime import datetime

from src.queries.get_tracks import _get_tracks
from src.utils.db_session import get_db
from tests.utils import populate_mock_db


def test_get_tracks_by_date(app):
    """Test getting tracks ordering by date"""
    with app.app_context():
        db = get_db()

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
        ],
    }

    populate_mock_db(db, test_entities)

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
