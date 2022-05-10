import asyncio
import os
import subprocess
import time

import pytest
from integration_tests.conftest import DB_URL
from integration_tests.utils import populate_mock_db
from src.utils.db_session import get_db
from src.utils.elasticdsl import ES_INDEXES, esclient

env = os.environ
env["audius_db_url"] = DB_URL
env["audius_elasticsearch_url"] = "http://localhost:9200"
env["audius_elasticsearch_run_indexer"] = "true"

basic_entities = {
    "aggregate_plays": [{"play_item_id": 1, "count": 1}],
    "aggregate_user": [{"user_id": 1, "track_count": 1}],
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
    ],
    "saves": [
        {"save_item_id": 1, "save_type": "track", "user_id": 2},
    ],
}


@pytest.fixture(scope="module", autouse=True)
def my_fixture():
    esclient.delete_by_query(index=ES_INDEXES, query={"match_all": {}})


def test_es_indexer_catchup(app):
    with app.app_context():
        db = get_db()

    populate_mock_db(db, basic_entities)

    try:
        subprocess.run(
            ["npm", "run", "dev"],
            env=env,
            capture_output=True,
            text=True,
            cwd="es-indexer",
            timeout=5,
        )
        raise Exception("Elasticsearch indexing stopped")
    except subprocess.TimeoutExpired as timeout:
        if "catchup done" not in timeout.output.decode("utf-8"):
            raise Exception("Elasticsearch failed to index")
    esclient.indices.refresh(index="*")
    search_res = esclient.search(index="*", query={"match_all": {}})["hits"]["hits"]
    assert len(search_res) == 5


def test_es_indexer_processing(app):
    with app.app_context():
        db = get_db()
    try:
        proc = subprocess.Popen(
            ["npm", "run", "dev"],
            env=env,
            cwd="es-indexer",
            text=True,
            stdout=subprocess.PIPE,
        )
        time.sleep(4)
        populate_mock_db(db, basic_entities)
        proc.communicate(timeout=2)
    except subprocess.TimeoutExpired as timeout:
        if "processed new updates" not in timeout.output.decode("utf-8"):
            raise Exception("Elasticsearch failed to process updates")
        esclient.indices.refresh(index="*")
        search_res = esclient.search(index="*", query={"match_all": {}})["hits"]["hits"]
        assert len(search_res) == 5
