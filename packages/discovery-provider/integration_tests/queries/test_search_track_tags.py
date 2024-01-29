import logging
import os
import subprocess

from integration_tests.utils import populate_mock_db
from src.queries.search_es import search_tags_es
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


def test_search_track_tags(app_module):
    return

    """Tests that search by tags works fopr tracks"""
    with app_module.app_context():
        db = get_db()

    test_entities = {
        "users": [
            {"user_id": 1},
            {"user_id": 2},
            {"user_id": 3},
        ],
        "tracks": [
            {"track_id": 1, "tags": "", "owner_id": 1},
            {"track_id": 2, "owner_id": 1, "tags": "pop,rock,electric"},
            {"track_id": 3, "owner_id": 2},
            {"track_id": 4, "owner_id": 2, "tags": "funk,pop", "is_stream_gated": True},
            {"track_id": 5, "owner_id": 2, "tags": "funk,pop"},
            {"track_id": 6, "owner_id": 2, "tags": "funk,Funk,kpop"},
        ],
        "saves": [
            {"save_item_id": 2, "repost_type": "track", "user_id": 1},
            {"save_item_id": 4, "repost_type": "track", "user_id": 1},
        ],
        "reposts": [
            {"repost_item_id": 1, "repost_type": "track", "user_id": 1},
            {"repost_item_id": 1, "repost_type": "track", "user_id": 2},
            {"repost_item_id": 2, "repost_type": "track", "user_id": 1},
            {"repost_item_id": 2, "repost_type": "track", "user_id": 2},
            {"repost_item_id": 4, "repost_type": "track", "user_id": 1},
            {"repost_item_id": 5, "repost_type": "track", "user_id": 1},
            {"repost_item_id": 5, "repost_type": "track", "user_id": 2},
            {"repost_item_id": 5, "repost_type": "track", "user_id": 3},
        ],
    }

    populate_mock_db(db, test_entities)

    logs = subprocess.run(
        ["npm", "run", "catchup:ci"],
        env=os.environ,
        capture_output=True,
        text=True,
        cwd="es-indexer",
        timeout=30,
    )
    logger.info(logs)

    result = search_tags_es("pop", kind="tracks")
    tracks = result["tracks"]

    assert len(tracks) == 3
    assert tracks[0]["track_id"] == 5  # First w/ 3 reposts
    assert tracks[1]["track_id"] == 2  # Sec w/ 2 reposts
    assert tracks[2]["track_id"] == 4  # Third w/ 1 reposts
    # Track id 6 does not appear b/c kpop and pop are not exact matches

    # curent user
    result = search_tags_es("pop", kind="tracks", current_user_id=1)
    tracks = result["saved_tracks"]
    assert len(tracks) == 2
