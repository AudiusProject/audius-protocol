import logging
from datetime import datetime, timedelta
from typing import List

from integration_tests.utils import populate_mock_db
from src.models.playlists.playlists_tracks_relations import PlaylistsTracksRelations
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)

# Insert Playlist with two new tracks and check that a notification is created for the track owners
now = datetime.now()
entities = {
    "tracks": [
        {"track_id": 20, "owner_id": 1},
        {"track_id": 10, "owner_id": 2},
        {"track_id": 30, "owner_id": 15},
        {"track_id": 40, "owner_id": 12},
    ],
    "playlists": [
        {
            "playlist_owner_id": 2,
            "created_at": now,
            "updated_at": now,
            "playlist_contents": {
                "track_ids": [
                    {"time": datetime.timestamp(now), "track": 20},
                    {"time": datetime.timestamp(now), "track": 30},
                    {"time": datetime.timestamp(now), "track": 10},
                    {
                        "time": datetime.timestamp(now - timedelta(minutes=1)),
                        "track": 40,
                    },
                ]
            },
        },
    ],
}


def test_add_playlist(app):
    with app.app_context():
        db = get_db()
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        relations: List[PlaylistsTracksRelations] = session.query(
            PlaylistsTracksRelations
        ).all()
        assert len(relations) == 4
        for id in [20, 10, 30, 40]:
            assert any([relation.track_id == id for relation in relations])
