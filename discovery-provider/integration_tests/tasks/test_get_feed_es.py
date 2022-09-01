import logging
import os
import subprocess

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
    ],
    "tracks": [
        {"track_id": 1, "owner_id": 1},
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
    ],
    "follows": [
        {
            "follower_user_id": 1,
            "followee_user_id": 2,
        }
    ],
    "reposts": [
        {"repost_item_id": 1, "repost_type": "track", "user_id": 2},
        {"repost_item_id": 1, "repost_type": "playlist", "user_id": 2},
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
    subprocess.run(
        ["npm", "run", "catchup:ci"],
        env=os.environ,
        capture_output=True,
        text=True,
        cwd="es-indexer",
        timeout=5,
    )
    esclient.indices.refresh(index="*")
    search_res = esclient.search(index="*", query={"match_all": {}})["hits"]["hits"]
    assert len(search_res) == 8

    # test feed
    feed_results = get_feed_es({"user_id": "1"})
    assert feed_results[0]["playlist_id"] == 1
    assert feed_results[0]["save_count"] == 1
    assert len(feed_results[0]["followee_reposts"]) == 1

    assert feed_results[1]["track_id"] == 1
    assert feed_results[1]["save_count"] == 1
