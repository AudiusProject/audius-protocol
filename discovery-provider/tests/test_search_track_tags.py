from src.queries.search_track_tags import search_track_tags
from src.utils.db_session import get_db
from tests.utils import populate_mock_db


def test_search_track_tags(app):
    """Tests that search by tags works fopr tracks"""
    with app.app_context():
        db = get_db()

    test_entities = {
        "tracks": [
            {"track_id": 1, "tags": "", "owner_id": 1},
            {"track_id": 2, "owner_id": 1, "tags": "pop,rock,electric"},
            {"track_id": 3, "owner_id": 2},
            {"track_id": 4, "owner_id": 2, "tags": "funk,pop"},
            {"track_id": 5, "owner_id": 2, "tags": "funk,pop"},
            {"track_id": 6, "owner_id": 2, "tags": "funk,Funk,kpop"},
        ],
        "plays": [
            {"item_id": 1},
            {"item_id": 1},
            {"item_id": 2},
            {"item_id": 2},
            {"item_id": 4},
            {"item_id": 5},
            {"item_id": 5},
            {"item_id": 5},
        ],
    }

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        session.execute("REFRESH MATERIALIZED VIEW tag_track_user")
        session.execute("REFRESH MATERIALIZED VIEW aggregate_plays")
        args = {"search_str": "pop", "current_user_id": None, "limit": 10, "offset": 0}
        tracks = search_track_tags(session, args)

        assert len(tracks) == 3
        assert tracks[0]["track_id"] == 5  # First w/ 3 plays
        assert tracks[1]["track_id"] == 2  # Sec w/ 2 plays
        assert tracks[2]["track_id"] == 4  # Third w/ 1 plays

        # Track id 6 does not appear b/c kpop and pop are not exact matches
