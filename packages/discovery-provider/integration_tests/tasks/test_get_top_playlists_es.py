import logging
import os
import subprocess
import time

from elasticsearch import Elasticsearch

from integration_tests.utils import populate_mock_db
from src.queries.get_top_playlists_es import get_top_playlists_es
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)

esclient = Elasticsearch(os.environ["audius_elasticsearch_url"])

entities = {
    "users": [{"user_id": 1}, {"user_id": 2}, {"user_id": 3}],
    "follows": [
        {"follower_user_id": 1, "followee_user_id": 2},
    ],
    "tracks": [
        {"track_id": 1, "owner_id": 2, "genre": "Electronic"},
        {"track_id": 2, "owner_id": 3, "genre": "Electronic"},
    ],
    "playlists": [
        {
            "playlist_id": 1,
            "playlist_owner_id": 2,
            "playlist_contents": {"track_ids": [{"track": 1, "time": 1}]},
        },
        {
            "playlist_id": 2,
            "playlist_owner_id": 3,
            "playlist_contents": {"track_ids": [{"track": 2, "time": 2}]},
        },
    ],
}


def setup_db(app):
    with app.app_context():
        db = get_db()

    populate_mock_db(db, entities)

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


def test_get_top_playlists(app):
    setup_db(app)

    with app.app_context():
        playlists = get_top_playlists_es(
            "playlist", {"current_user_id": 1, "limit": 10}
        )
        # user 1 should see all top playlists
        assert len(playlists) == 2
        assert playlists[0]["playlist_id"] == 1
        assert playlists[1]["playlist_id"] == 2


def test_get_top_followee_playlists(app):
    setup_db(app)

    with app.app_context():
        playlists = get_top_playlists_es(
            "playlist", {"current_user_id": 1, "limit": 10, "filter": "followees"}
        )
        # assert user 1 only sees playlists from who they follow (user 2)
        assert len(playlists) == 1
        assert playlists[0]["playlist_id"] == 1
