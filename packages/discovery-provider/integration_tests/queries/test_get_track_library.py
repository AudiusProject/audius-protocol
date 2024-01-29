from datetime import datetime

from integration_tests.utils import populate_mock_db
from src.queries.get_track_library import (
    GetTrackLibraryArgs,
    LibraryFilterType,
    SortMethod,
    _get_track_library,
)
from src.utils.db_session import get_db


def populate_tracks(db):
    test_entities = {
        "tracks": [
            {
                "track_id": 17,
                "title": "track 17",
                "owner_id": 1287290,
                "release_date": datetime(2019, 6, 17),
                "created_at": datetime(2019, 6, 17),
            },
            {
                "track_id": 18,
                "title": "track 18",
                "owner_id": 1287290,
                "created_at": datetime(2019, 6, 18),
            },
            {
                "track_id": 19,
                "title": "track 19",
                "owner_id": 1287290,
                "release_date": datetime(2019, 6, 18),
                "created_at": datetime(2021, 6, 17),
                "ai_attribut /duion_user_id": 1287290,
            },
            {
                "track_id": 20,
                "title": "a 20",
                "owner_id": 1287290,
                "release_date": datetime(2019, 6, 18),
                "created_at": datetime(2019, 6, 19),
            },
            {
                "track_id": 21,
                "title": "z 21",
                "owner_id": 6,
                "release_date": datetime(2019, 6, 18),
                "created_at": datetime(2019, 6, 20),
            },
            {
                "track_id": 22,
                "title": "track 22",
                "owner_id": 5,
                "release_date": datetime(2019, 6, 18),
                "created_at": datetime(2021, 6, 17),
            },
            {
                "track_id": 23,
                "title": "some_title",
                "owner_id": 7,
                "release_date": datetime(2019, 6, 18),
                "created_at": datetime(2019, 6, 16),
            },
            {
                "track_id": 24,
                "title": "track 24",
                "owner_id": 5,
                "release_date": datetime(2019, 6, 18),
                "created_at": datetime(2019, 6, 20),
            },
            {
                "track_id": 25,
                "title": "track 25",
                "owner_id": 5,
                "release_date": datetime(2019, 6, 18),
                "created_at": datetime(2019, 6, 20),
                "is_unlisted": True,
            },
            {
                "track_id": 26,
                "title": "track 26",
                "owner_id": 5,
                "release_date": datetime(2019, 6, 18),
                "created_at": datetime(2019, 6, 21),
                "is_delete": True,
            },
        ],
        "track_routes": [
            {"slug": "track-17", "owner_id": 1287290},
            {"slug": "track-18", "owner_id": 1287290},
            {
                "slug": "different-track-2",
                "owner_id": 5,
                "track_id": 22,
            },
            {
                "slug": "track-23",
                "owner_id": 5,
                "track_id": 23,
            },
            {
                "slug": "track-24",
                "owner_id": 5,
                "track_id": 24,
            },
            {
                "slug": "hidden-track-2",
                "owner_id": 5,
                "track_id": 25,
            },
        ],
        "users": [
            {"user_id": 1287290, "handle": "new-test-user"},
            {
                "user_id": 5,
                "handle": "a handle",
                "artist_pick_track_id": 22,
                "allow_ai_attribution": True,
            },
            {
                "user_id": 6,
                "handle": "b handle",
                "artist_pick_track_id": 22,
                "allow_ai_attribution": True,
            },
            {
                "user_id": 7,
                "handle": "c handle",
                "artist_pick_track_id": 22,
                "allow_ai_attribution": True,
            },
        ],
        "reposts": [
            {
                "repost_item_id": 17,
                "repost_type": "track",
                "user_id": 1287290,
                "created_at": "2022-01-01T00:00:00Z",
            },
            {
                "repost_item_id": 18,
                "repost_type": "track",
                "user_id": 1287290,
                "created_at": "2022-01-02T00:00:00Z",
            },
            {
                "repost_item_id": 20,
                "repost_type": "track",
                "user_id": 1287290,
                "created_at": "2022-01-03T00:00:00Z",
            },
            {
                "repost_item_id": 19,
                "repost_type": "track",
                "user_id": 5,
                "created_at": "2022-01-03T00:00:00Z",
            },
            {
                "repost_item_id": 20,
                "repost_type": "track",
                "user_id": 5,
                "created_at": "2022-01-03T00:00:00Z",
            },
            {
                "repost_item_id": 20,
                "repost_type": "track",
                "user_id": 6,
                "created_at": "2022-01-03T00:00:00Z",
            },
            {
                "repost_item_id": 21,
                "repost_type": "track",
                "user_id": 6,
                "created_at": "2022-01-03T00:00:00Z",
            },
        ],
        "saves": [
            {
                "save_item_id": 20,
                "save_type": "track",
                "user_id": 1287290,
                "created_at": "2022-01-04T00:00:00Z",
            },
            {
                "save_item_id": 20,
                "save_type": "track",
                "user_id": 1,
                "created_at": "2022-01-04T00:00:00Z",
            },
            {
                "save_item_id": 21,
                "save_type": "track",
                "user_id": 1287290,
                "created_at": "2022-01-05T00:00:00Z",
            },
            {
                "save_item_id": 22,
                "save_type": "track",
                "user_id": 5,
                "created_at": "2022-01-06T00:00:00Z",
            },
            {
                "save_item_id": 23,
                "save_type": "track",
                "user_id": 1287290,
                "created_at": "2022-01-07T00:00:00Z",
            },
            {
                "save_item_id": 23,
                "save_type": "track",
                "user_id": 1,
                "created_at": "2022-01-07T00:00:00Z",
            },
            {
                "save_item_id": 23,
                "save_type": "track",
                "user_id": 2,
                "created_at": "2022-01-07T00:00:00Z",
            },
        ],
        "aggregate_plays": [
            {
                "play_item_id": 20,
                "count": 1,
            },
            {
                "play_item_id": 21,
                "count": 5,
            },
            {
                "play_item_id": 23,
                "count": 100,
            },
        ],
        "usdc_purchases": [
            {
                "buyer_user_id": 1287290,
                "seller_user_id": 5,
                "content_id": 26,
                "created_at": "2022-01-06T00:00:00Z",
            },
            {
                "buyer_user_id": 5,
                "seller_user_id": 6,
                "content_id": 24,
                "created_at": "2022-01-05T00:00:00Z",
            },
            {
                "buyer_user_id": 5,
                "seller_user_id": 6,
                "content_id": 25,
                "created_at": "2022-01-03T00:00:00Z",
            },
        ],
    }

    populate_mock_db(db, test_entities)


def with_tracks_library_setup(test_fn):
    def wrapper(app):
        with app.app_context():
            db = get_db()
        populate_tracks(db)
        with db.scoped_session() as session:
            test_fn(session)

    return wrapper


@with_tracks_library_setup
def test_favorites_sort_methods(session):
    """Test all sort methods for favorites filter type. Assumes that if this test passes, sort methods for other filter types will also pass."""

    args = GetTrackLibraryArgs(
        user_id=1287290,
        current_user_id=1287290,
        limit=10,
        offset=0,
        filter_type=LibraryFilterType.favorite,
        filter_deleted=False,
    )

    # Maps sort method to expected track_id return order
    sort_method_to_track_id_map = {
        # When no sort method, it should default to sorting by favorite created_at desc
        None: [23, 21, 20],
        # Other sort methods should default to asc
        SortMethod.title: [20, 23, 21],
        SortMethod.artist_name: [20, 21, 23],
        SortMethod.release_date: [23, 21, 20],
        SortMethod.added_date: [
            20,
            21,
            23,
        ],  # the time the favorites were created ascending
        SortMethod.plays: [20, 21, 23],
        SortMethod.reposts: [23, 21, 20],
        SortMethod.saves: [21, 20, 23],
        # SortMethod.last_listen_date: [] # NOT SUPPORTED
        # SortMethod.most_listens_by_user: [], # NOT SUPPORTED
    }
    for k, v in sort_method_to_track_id_map.items():
        args["sort_method"] = k
        track_library = _get_track_library(args, session)
        # ensure same amount of tracks returned
        print("Testing sort method: ", k)
        assert len(track_library) == len(
            v
        ), f"sort method: {k} should return {len(v)} tracks"
        # Ensure correct ordering
        for i, e in enumerate(v):
            assert (
                track_library[i]["track_id"] == e
            ), f"sort method: {k} should return track_id: {e} at index {i}"


def assert_correct_track(track_library, index, expected_id):
    assert (
        track_library[index]["track_id"] == expected_id
    ), f"should return track_id: {expected_id} at index {index}"


@with_tracks_library_setup
def test_purchases(session):
    """Tests that purchased tracks are returned"""
    args = GetTrackLibraryArgs(
        user_id=1287290,
        current_user_id=1287290,
        limit=10,
        offset=0,
        filter_type=LibraryFilterType.purchase,
        filter_deleted=False,
    )

    track_library = _get_track_library(args, session)
    assert len(track_library) == 1, "should return 1 track"
    assert_correct_track(track_library, 0, 26)


@with_tracks_library_setup
def test_purchases_sort_order(session):
    """Tests purchases with a manual sort order"""
    args = GetTrackLibraryArgs(
        user_id=5,
        current_user_id=5,
        limit=10,
        offset=0,
        filter_type=LibraryFilterType.purchase,
        filter_deleted=False,
        sort_method=SortMethod.added_date,
    )

    track_library = _get_track_library(args, session)
    assert len(track_library) == 2, "should return 2 tracks"
    assert_correct_track(track_library, 0, 25)
    assert_correct_track(track_library, 1, 24)


@with_tracks_library_setup
def test_reposts(session):
    """Extremely basic test that reposts work. Returns one repost this is also a favorite, and two that are just reposts.
    Should return them in desc order of repost creation time because no sort method is specified.
    """
    args = GetTrackLibraryArgs(
        user_id=1287290,
        current_user_id=1287290,
        limit=10,
        offset=0,
        filter_type=LibraryFilterType.repost,
        filter_deleted=False,
    )

    track_library = _get_track_library(args, session)
    assert len(track_library) == 3, "should return 3 tracks"
    assert_correct_track(track_library, 0, 20)
    assert_correct_track(track_library, 1, 18)
    assert_correct_track(track_library, 2, 17)


@with_tracks_library_setup
def test_all_filter(session):
    """Ensures we return favorites/reposts/purchases in the same query, with no dupes.
    3 reposts (17, 18, 20), 3 saves (20, 21, 23), 1 purchase (26).
    Should be ordered by created_at desc of the item (repost/purchase/save), so 23, 26, 21, 20, 18, 17
    """

    args = GetTrackLibraryArgs(
        user_id=1287290,
        current_user_id=1287290,
        limit=10,
        offset=0,
        filter_type=LibraryFilterType.all,
        filter_deleted=False,
    )
    track_library = _get_track_library(args, session)
    assert len(track_library) == 6, "should return 6 tracks"
    # reposts:
    # 17 -  01-01
    # 18 -  01-02
    # 20 -  01-03
    # saves:
    # 20 -  01-04
    # 21 -  01-05
    # 23 -  01-07
    # purchases:
    # 26 -  01-06
    assert_correct_track(track_library, 0, 23)
    assert_correct_track(track_library, 1, 26)
    assert_correct_track(track_library, 2, 21)
    assert_correct_track(track_library, 3, 20)
    assert_correct_track(track_library, 4, 18)
    assert_correct_track(track_library, 5, 17)


@with_tracks_library_setup
def test_tracks_query(session):
    # Test it with all query path
    # TODO: [PAY-1643] Enable this test again
    args = GetTrackLibraryArgs(
        user_id=1287290,
        current_user_id=1287290,
        limit=10,
        offset=0,
        filter_type=LibraryFilterType.all,
        filter_deleted=False,
        query="some_title",
    )

    # track_library = _get_track_library(args, session)
    # assert len(track_library) == 1, "should return 1 track"
    # assert_correct_track(track_library, 0, 23)

    # Test it with favorite query path

    args = GetTrackLibraryArgs(
        user_id=1287290,
        current_user_id=1287290,
        limit=10,
        offset=0,
        filter_type=LibraryFilterType.favorite,
        filter_deleted=False,
        query="some_title",
    )

    track_library = _get_track_library(args, session)
    assert len(track_library) == 1, "should return 1 track"
    assert_correct_track(track_library, 0, 23)
