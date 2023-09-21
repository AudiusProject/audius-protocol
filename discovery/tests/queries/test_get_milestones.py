from datetime import datetime

from src.models.notifications.milestone import Milestone, MilestoneName
from src.queries.notifications import get_milestone_info
from src.utils.db_session import get_db
from tests.utils import populate_mock_db

date = datetime(2020, 10, 4, 10, 35, 0)


def test_get_milestones(app):
    with app.app_context():
        db_mock = get_db()

    test_entities = {
        "users": [{"user_id": 1}, {"user_id": 2}, {"user_id": 3}, {"user_id": 4}],
        "tracks": [
            {
                "track_id": 1,
                "owner_id": 1,
            },
            {
                "track_id": 2,
                "owner_id": 3,
            },
        ],
        "playlists": [
            {"playlist_id": 1, "playlist_owner_id": 1, "is_album": False},
            {"playlist_id": 2, "playlist_owner_id": 2, "is_album": False},
            {"playlist_id": 3, "playlist_owner_id": 1, "is_album": True},
            {"playlist_id": 4, "playlist_owner_id": 3, "is_album": True},
        ],
    }

    populate_mock_db(db_mock, test_entities)

    with db_mock.scoped_session() as session:
        session.bulk_save_objects(
            [
                Milestone(
                    id=1,
                    name=MilestoneName.FOLLOWER_COUNT,
                    threshold=10,
                    blocknumber=1,
                    timestamp=date,
                ),
                Milestone(
                    id=2,
                    name=MilestoneName.FOLLOWER_COUNT,
                    threshold=25,
                    blocknumber=1,
                    timestamp=date,
                ),
                Milestone(
                    id=1,
                    name=MilestoneName.PLAYLIST_REPOST_COUNT,
                    threshold=10,
                    blocknumber=1,
                    timestamp=date,
                ),
                Milestone(
                    id=2,
                    name=MilestoneName.PLAYLIST_REPOST_COUNT,
                    threshold=25,
                    blocknumber=1,
                    timestamp=date,
                ),
                Milestone(
                    id=3,
                    name=MilestoneName.PLAYLIST_SAVE_COUNT,
                    threshold=500,
                    blocknumber=1,
                    timestamp=date,
                ),
                Milestone(
                    id=1,
                    name=MilestoneName.TRACK_REPOST_COUNT,
                    threshold=1000,
                    blocknumber=6,
                    timestamp=date,
                ),
                Milestone(
                    id=2,
                    name=MilestoneName.TRACK_SAVE_COUNT,
                    threshold=100,
                    blocknumber=10,
                    timestamp=date,
                ),
            ]
        )

        milestones = get_milestone_info(session, 0, 100)

        assert milestones == {
            "follower_counts": {1: 10, 2: 25},
            "repost_counts": {
                "tracks": {1: 1000},
                "albums": {},
                "playlists": {1: 10, 2: 25},
            },
            "favorite_counts": {
                "tracks": {2: 100},
                "albums": {3: 500},
                "playlists": {},
            },
        }
