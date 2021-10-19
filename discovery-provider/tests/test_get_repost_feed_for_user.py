from src.queries.get_repost_feed_for_user import _get_repost_feed_for_user
from src.utils.db_session import get_db
from tests.utils import populate_mock_db


def test_get_repost_feed_for_user(app):
    """Tests that a repost feed for a user can be queried"""
    with app.app_context():
        db = get_db()

    test_entities = {
        "reposts": [
            # Note these reposts are in chronological order in addition
            # so the repost feed should pull them "backwards" for reverse chronological
            # sort order.
            {"user_id": 1, "repost_item_id": 5, "repost_type": "track"},
            {"user_id": 1, "repost_item_id": 2, "repost_type": "track"},
            {"user_id": 1, "repost_item_id": 3, "repost_type": "track"},
            {"user_id": 1, "repost_item_id": 1, "repost_type": "track"},
            {"user_id": 1, "repost_item_id": 4, "repost_type": "track"},
            {"user_id": 1, "repost_item_id": 4, "repost_type": "playlist"},
            {"user_id": 1, "repost_item_id": 8, "repost_type": "album"},
            {"user_id": 1, "repost_item_id": 6, "repost_type": "track"},
        ],
        "tracks": [
            {"track_id": 1, "title": "track 1"},
            {"track_id": 2, "title": "track 2"},
            {"track_id": 3, "title": "track 3"},
            {"track_id": 4, "title": "track 4"},
            {"track_id": 5, "title": "track 5"},
            {"track_id": 6, "title": "track 6"},
            {"track_id": 7, "title": "track 7"},
            {"track_id": 8, "title": "track 8"},
        ],
        "playlists": [
            {"playlist_id": 1, "playlist_name": "playlist 1"},
            {"playlist_id": 2, "playlist_name": "playlist 2"},
            {"playlist_id": 3, "playlist_name": "playlist 3"},
            {"playlist_id": 4, "playlist_name": "playlist 4"},
            {"playlist_id": 5, "playlist_name": "playlist 5"},
            {"playlist_id": 6, "playlist_name": "playlist 6"},
            {"playlist_id": 7, "playlist_name": "playlist 7"},
            {"playlist_id": 8, "playlist_name": "album 8"},
        ],
    }

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        repost_feed = _get_repost_feed_for_user(session, 1, {"limit": 10, "offset": 0})

    assert repost_feed[0]["title"] == "track 6"
    assert repost_feed[1]["playlist_name"] == "album 8"
    assert repost_feed[2]["playlist_name"] == "playlist 4"
    assert repost_feed[3]["title"] == "track 4"
    assert repost_feed[4]["title"] == "track 1"
    assert repost_feed[5]["title"] == "track 3"
    assert repost_feed[6]["title"] == "track 2"
    assert repost_feed[7]["title"] == "track 5"
