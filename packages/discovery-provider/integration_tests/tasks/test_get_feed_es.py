import logging
import os
import subprocess
import time

from elasticsearch import Elasticsearch

from integration_tests.utils import populate_mock_db
from src.queries.get_feed_es import get_feed_es
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)

esclient = Elasticsearch(os.environ["audius_elasticsearch_url"])

basic_entities = {
    "users": [
        {"user_id": 1, "handle": "user1"},
        {"user_id": 2, "handle": "user2"},
        {"user_id": 3, "handle": "user3"},
        {"user_id": 4, "handle": "user4"},
        {"user_id": 5, "handle": "user5"},
        {"user_id": 6, "handle": "user6"},
    ],
    "tracks": [
        {"track_id": 1, "owner_id": 1},
        # user3 has 2 tracks that are in a playlist
        {"track_id": 2, "owner_id": 3},
        {"track_id": 3, "owner_id": 3},
        # user3 has 1 track that's NOT in the playlist
        {"track_id": 4, "owner_id": 3},
        # user4 has 1 track that's NOT in a playlist
        {"track_id": 5, "owner_id": 4},
        # user4 has 1 track that is in a playlist
        {"track_id": 6, "owner_id": 4},
        # user5 has 1 hidden track that is in a playlist
        {"track_id": 7, "owner_id": 5, "is_unlisted": True},
    ],
    "playlists": [
        {
            "playlist_id": 1,
            "playlist_owner_id": 1,
            "playlist_contents": {
                "track_ids": [
                    {"track": 1, "time": 1},
                ]
            },
        },
        {
            "playlist_id": 2,
            "playlist_owner_id": 3,
            "playlist_contents": {
                "track_ids": [
                    {"track": 2, "time": 2},
                    {"track": 3, "time": 3},
                ]
            },
        },
        {
            "playlist_id": 3,
            "playlist_owner_id": 4,
            "playlist_contents": {
                "track_ids": [
                    {"track": 6, "time": 4},
                ]
            },
        },
        {
            "playlist_id": 4,
            "playlist_owner_id": 5,
            "playlist_contents": {
                "track_ids": [
                    {"track": 7, "time": 5},
                ]
            },
        },
    ],
    "follows": [
        # user 1 follows user 2
        {
            "follower_user_id": 1,
            "followee_user_id": 2,
        },
        # user 2 follows user 3
        {
            "follower_user_id": 2,
            "followee_user_id": 3,
        },
        # user 1 follows user 4
        {
            "follower_user_id": 1,
            "followee_user_id": 4,
        },
        # user 1 follows user 5
        {
            "follower_user_id": 1,
            "followee_user_id": 5,
        },
    ],
    "reposts": [
        {"repost_item_id": 1, "repost_type": "track", "user_id": 2},
        {"repost_item_id": 1, "repost_type": "playlist", "user_id": 2},
        {"repost_item_id": 4, "repost_type": "playlist", "user_id": 2},
    ],
    "saves": [
        {"save_item_id": 1, "save_type": "track", "user_id": 2},
        {"save_item_id": 1, "save_type": "playlist", "user_id": 2},
    ],
}


def test_get_feed_es(app):
    """
    Tests es-indexer catchup + get_feed_es
    """

    with app.app_context():
        db = get_db()

    populate_mock_db(db, basic_entities)

    # run indexer catchup
    time.sleep(1)
    logs = subprocess.run(
        ["npm", "run", "catchup:ci"],
        env=os.environ,
        capture_output=True,
        text=True,
        cwd="es-indexer",
        timeout=30,
    )
    logging.info(logs)
    esclient.indices.refresh(index="*")
    search_res = esclient.search(index="*", query={"match_all": {}})["hits"]["hits"]
    # actually would be more than 10, but 10 is the default `size`...
    assert len(search_res) == 10

    # test feed
    with app.app_context():
        feed_results = get_feed_es({"user_id": "1"})
        assert len(feed_results) == 4
        assert feed_results[0]["playlist_id"] == 1
        assert feed_results[0]["save_count"] == 1
        assert len(feed_results[0]["followee_reposts"]) == 1
        assert len(feed_results[0]["tracks"]) == 1
        assert len(feed_results[0]["tracks"][0]["track_id"]) == 1
        assert len(feed_results[0]["tracks"][0]["track_id"]) == 1

        assert feed_results[1]["track_id"] == 1
        assert feed_results[1]["save_count"] == 1

        assert feed_results[2]["playlist_id"] == 3
        assert feed_results[3]["track_id"] == 5

        # Test offset works
        feed_results = get_feed_es({"user_id": "1"}, offset=1)
        assert len(feed_results) == 3
        assert feed_results[0]["track_id"] == 1
        assert feed_results[0]["save_count"] == 1

        assert feed_results[1]["playlist_id"] == 3
        assert feed_results[2]["track_id"] == 5

        # Test limit works
        feed_results = get_feed_es({"user_id": "1"}, offset=1, limit=1)
        assert len(feed_results) == 1
        assert feed_results[0]["track_id"] == 1
        assert feed_results[0]["save_count"] == 1

        # playlist <> track dedupe:
        # user2 follows user3
        # user3 should have one playlist and one track
        #   the 2 tracks in the playlist should be de-duped
        feed_results = get_feed_es({"user_id": "2"})
        assert len(feed_results) == 2
        assert feed_results[0]["playlist_id"] == 2
        assert feed_results[1]["track_id"] == 4

        # user 3 follows nobody
        feed_results = get_feed_es({"user_id": "3"})
        assert len(feed_results) == 0

        # user 3 with explicit IDs
        feed_results = get_feed_es({"user_id": "3", "followee_user_ids": [2]})
        assert len(feed_results) == 2


access_control_entities = {
    "users": [
        {"user_id": 1, "handle": "user1"},
        {"user_id": 2, "handle": "user2"},
    ],
    "tracks": [
        {"track_id": 1, "owner_id": 1, "is_unlisted": True},
        {"track_id": 2, "owner_id": 1, "is_delete": True},
    ],
    "playlists": [
        {
            "playlist_id": 1,
            "playlist_name": "Empty",
            "playlist_owner_id": 1,
            "playlist_contents": {"track_ids": []},
        },
        {
            "playlist_id": 2,
            "playlist_name": "Hidden Tracks",
            "playlist_owner_id": 1,
            "playlist_contents": {
                "track_ids": [
                    {"track": 1, "time": 1},
                ]
            },
        },
        {
            "playlist_id": 3,
            "playlist_name": "Deleted Tracks",
            "playlist_owner_id": 1,
            "playlist_contents": {
                "track_ids": [
                    {"track": 2, "time": 2},
                ]
            },
        },
    ],
    "follows": [
        # user 2 follows user 1
        {
            "follower_user_id": 2,
            "followee_user_id": 1,
        },
    ],
}


def test_access_controls(app):
    """
    Ensurses empty albums, albums with only deleted tracks, and hidden albums
    are not returned
    """

    with app.app_context():
        db = get_db()

    populate_mock_db(db, access_control_entities)

    # run indexer catchup
    time.sleep(1)
    logs = subprocess.run(
        ["npm", "run", "catchup:ci"],
        env=os.environ,
        capture_output=True,
        text=True,
        cwd="es-indexer",
        timeout=30,
    )
    logging.info(logs)
    esclient.indices.refresh(index="*")
    search_res = esclient.search(index="*", query={"match_all": {}})["hits"]["hits"]
    assert len(search_res) == 7

    with app.app_context():
        feed_results = get_feed_es({"user_id": "2"})
        assert len(feed_results) == 0
