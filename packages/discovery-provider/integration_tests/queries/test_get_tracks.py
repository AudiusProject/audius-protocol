from datetime import datetime

from integration_tests.utils import populate_mock_db
from src.queries.get_remixable_tracks import get_remixable_tracks
from src.queries.get_tracks import _get_tracks
from src.queries.query_helpers import SortDirection, SortMethod
from src.utils.db_session import get_db


def populate_tracks(db):
    test_entities = {
        "tracks": [
            {
                "track_id": 1,
                "title": "track 1",
                "owner_id": 1287289,
                "release_date": datetime(2019, 12, 20),
                "created_at": datetime(2018, 5, 17),
            },
            {
                "track_id": 2,
                "title": "track 2",
                "owner_id": 1287289,
                "release_date": datetime(2018, 5, 18),
                "created_at": datetime(2018, 5, 18),
            },
            {
                "track_id": 3,
                "title": "track 3",
                "owner_id": 1287289,
                "release_date": datetime(2019, 12, 18),
                "created_at": datetime(2020, 5, 17),
                "ai_attribution_user_id": 1287289,
            },
            {
                "track_id": 4,
                "title": "track 4",
                "owner_id": 1287289,
                "release_date": datetime(2018, 5, 19),
                "created_at": datetime(2018, 5, 19),
            },
            {
                "track_id": 5,
                "title": "track 5",
                "owner_id": 1287289,
                "release_date": datetime(2018, 5, 20),
                "created_at": datetime(2018, 5, 20),
            },
            {
                "track_id": 6,
                "title": "track 6",
                "owner_id": 4,
                "release_date": datetime(2019, 12, 18),
                "created_at": datetime(2020, 5, 17),
            },
            {
                "track_id": 7,
                "title": "track 7",
                "owner_id": 4,
                "release_date": datetime(2018, 5, 19),
                "created_at": datetime(2018, 5, 19),
            },
            {
                "track_id": 8,
                "title": "track 8",
                "owner_id": 4,
                "release_date": datetime(2018, 5, 20),
                "created_at": datetime(2018, 5, 20),
            },
            {
                "track_id": 9,
                "title": "track 9",
                "owner_id": 4,
                "release_date": datetime(2019, 12, 25),
                "created_at": datetime(2018, 5, 20),
                "is_unlisted": True,
            },
            {
                "track_id": 10,
                "title": "track 10",
                "owner_id": 4,
                "release_date": datetime(2019, 12, 25),
                "created_at": datetime(2018, 5, 21),
                "is_delete": True,
            },
            {
                "track_id": 11,
                "title": "track 11",
                "owner_id": 1287289,
                "release_date": datetime(2019, 12, 19),
                "created_at": datetime(2018, 5, 17),
                "is_unlisted": True,
            },
            {
                "track_id": 12,
                "title": "track 12",
                "owner_id": 5,
                "release_date": datetime(2020, 6, 19),
                "created_at": datetime(2018, 5, 21),
                "ai_attribution_user_id": 1287289,
            },
            {
                "track_id": 13,
                "title": "track 13",
                "owner_id": 5,
                "release_date": datetime(2022, 10, 7),
                "created_at": datetime(2018, 5, 17),
            },
            {
                "track_id": 14,
                "title": "track 14",
                "owner_id": 5,
                "release_date": datetime(2019, 12, 25),
                "created_at": datetime(2020, 5, 17),
            },
            {
                "track_id": 15,
                "title": "track 15",
                "owner_id": 1287289,
                "release_date": datetime(2017, 5, 19),
                "created_at": datetime(2017, 5, 19),
            },
            {
                "track_id": 16,
                "title": "track 16",
                "owner_id": 1287289,
                "release_date": datetime(2017, 5, 19),
                "created_at": datetime(2017, 5, 19),
            },
        ],
        "track_routes": [
            {"slug": "track-1", "owner_id": 1287289},
            {"slug": "track-2", "owner_id": 1287289},
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
            {
                "slug": "hidden-track",
                "owner_id": 4,
                "track_id": 9,
            },
        ],
        "users": [
            {"user_id": 1287289, "handle": "some-test-user"},
            {"user_id": 4, "handle": "some-other-user"},
            {
                "user_id": 5,
                "handle": "test-user-5",
                "artist_pick_track_id": 12,
                "allow_ai_attribution": True,
            },
        ],
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

        assert len(tracks) == 7
        assert tracks[0]["track_id"] == 1
        assert tracks[1]["track_id"] == 3
        assert tracks[2]["track_id"] == 5
        assert tracks[3]["track_id"] == 4
        assert tracks[4]["track_id"] == 2

        # tracks created on the same day, with one missing 'release_date`
        # should fall back to sorting by id
        assert tracks[5]["track_id"] == 15
        assert tracks[6]["track_id"] == 16

        assert tracks[0]["permalink"] == "/some-test-user/track-1"
        assert tracks[4]["permalink"] == "/some-test-user/track-2"


def test_get_tracks_with_query(app):
    """Test getting tracks with a query"""

    with app.app_context():
        db = get_db()

    populate_tracks(db)

    with db.scoped_session() as session:
        tracks = _get_tracks(
            session, {"user_id": 1287289, "offset": 0, "limit": 10, "query": "track 5"}
        )

        assert len(tracks) == 1
        assert tracks[0]["track_id"] == 5


def test_get_tracks_by_date_authed(app):
    """
    Test getting tracks ordering by date with an authed user.
    This test should produce unlisted tracks.
    """

    with app.app_context():
        db = get_db()

    populate_tracks(db)

    with db.scoped_session() as session:
        tracks = _get_tracks(
            session,
            {
                "user_id": 1287289,
                "authed_user_id": 1287289,
                "offset": 0,
                "limit": 10,
                "sort": "date",
            },
        )

        assert len(tracks) == 8
        assert tracks[0]["track_id"] == 1
        assert tracks[1]["track_id"] == 11
        assert tracks[2]["track_id"] == 3
        assert tracks[3]["track_id"] == 5
        assert tracks[4]["track_id"] == 4
        assert tracks[5]["track_id"] == 2


def test_get_tracks_with_pinned_track(app):
    """
    Test getting tracks for a user with a pinned track. The
    pinned track should be the first result, with all other tracks
    sorted according to the sort parameter.
    """
    with app.app_context():
        db = get_db()

    populate_tracks(db)

    with db.scoped_session() as session:
        tracks = _get_tracks(
            session, {"user_id": 5, "offset": 0, "limit": 10, "sort": "date"}
        )

        assert len(tracks) == 3
        assert tracks[0]["track_id"] == 12
        assert tracks[1]["track_id"] == 13
        assert tracks[2]["track_id"] == 14


def test_get_tracks_with_pinned_track_and_sort_method(app):
    """
    Test getting tracks for a user with a pinned track. All tracks
    should be sorted according the sort method. The pinned track is
    not necessarily the first result.
    """
    with app.app_context():
        db = get_db()

    populate_tracks(db)

    with db.scoped_session() as session:
        tracks = _get_tracks(
            session,
            {
                "user_id": 5,
                "offset": 0,
                "limit": 10,
                "sort_method": SortMethod.release_date,
                "sort_direction": SortDirection.desc,
            },
        )

        assert len(tracks) == 3
        assert tracks[0]["track_id"] == 13
        assert tracks[1]["track_id"] == 12
        assert tracks[2]["track_id"] == 14


def test_get_track_by_route(app):
    """Test getting track by user handle and slug for route resolution"""
    with app.app_context():
        db = get_db()

        populate_tracks(db)

        with db.scoped_session() as session:
            tracks = _get_tracks(
                session,
                {
                    "routes": [{"owner_id": 1287289, "slug": "track-1"}],
                    "offset": 0,
                    "limit": 10,
                },
            )

            assert len(tracks) == 1, "track-1 is found for some-test-user"
            assert tracks[0]["owner_id"] == 1287289
            assert tracks[0]["permalink"] == "/some-test-user/track-1"

            tracks = _get_tracks(
                session,
                {
                    "routes": [{"owner_id": 4, "slug": "track-1"}],
                    "offset": 0,
                    "limit": 10,
                },
            )
            assert len(tracks) == 1, "track-1 is still found for some-other-user"
            assert tracks[0]["owner_id"] == 4
            assert tracks[0]["permalink"] == "/some-other-user/track-1"

            # Get an unlisted track
            tracks = _get_tracks(
                session,
                {
                    "routes": [{"owner_id": 4, "slug": "hidden-track"}],
                    "offset": 0,
                    "limit": 10,
                },
            )
            assert len(tracks) == 1
            assert tracks[0]["owner_id"] == 4
            assert tracks[0]["permalink"] == "/some-other-user/hidden-track"

            # Make sure unlisted tracks are hidden without slug
            tracks = _get_tracks(
                session,
                {"user_id": 4, "id": [9], "offset": 0, "limit": 10},
            )
            assert len(tracks) == 0


def test_get_remixable_tracks(app):
    with app.app_context():
        db = get_db()

        populate_tracks(db)
        populate_mock_db(
            db,
            {
                "remixes": [
                    {"parent_track_id": 9, "child_track_id": 1},
                    {"parent_track_id": 8, "child_track_id": 1},
                ],
                "stems": [
                    {"parent_track_id": 7, "child_track_id": 1},
                    {"parent_track_id": 6, "child_track_id": 1},
                    # Verify that tracks with deleted stems are not returned
                    {"parent_track_id": 5, "child_track_id": 10},
                ],
                "saves": [{"user_id": 4, "save_item_id": 1}],
                "reposts": [{"user_id": 4, "repost_item_id": 1}],
            },
        )

        tracks = get_remixable_tracks({"with_users": True})
        assert len(tracks) == 2
        assert tracks[0]["user"]


def test_get_ai_attributed_tracks(app):
    """Test getting tracks with AI attribution"""

    with app.app_context():
        db = get_db()

    populate_tracks(db)

    with db.scoped_session() as session:
        tracks = _get_tracks(
            session,
            {
                "user_id": 1287289,
                "offset": 0,
                "limit": 10,
                "ai_attributed_only": True,
                "sort": "date",
            },
        )
        assert len(tracks) == 2
        assert tracks[0]["track_id"] == 12
        assert tracks[1]["track_id"] == 3
