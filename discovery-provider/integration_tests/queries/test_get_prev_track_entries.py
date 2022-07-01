from integration_tests.utils import populate_mock_db
from src.models.tracks.track import Track
from src.queries.get_prev_track_entries import get_prev_track_entries
from src.utils.db_session import get_db


def test_get_prev_track_entries(app):
    """Tests that prev track entries query properly returns previous tracks"""
    with app.app_context():
        db = get_db()

    test_entities = {
        "tracks": [
            {
                "track_id": 1,
                "is_current": False,
                "is_unlisted": True,
                "remix_of": None,
            },  # Block 0
            {
                "track_id": 2,
                "is_current": True,
                "is_unlisted": False,
                "remix_of": None,
            },  # Block 1
            {
                "track_id": 3,
                "is_current": False,
                "is_unlisted": False,
                "remix_of": None,
            },  # Block 2
            {
                "track_id": 4,
                "is_current": False,
                "is_unlisted": False,
                "remix_of": None,
            },  # Block 3
            {
                "track_id": 5,
                "is_current": False,
                "is_unlisted": False,
                "remix_of": None,
            },  # Block 4
            {
                "track_id": 6,
                "is_current": False,
                "is_unlisted": True,
                "remix_of": None,
            },  # Block 5
            {
                "track_id": 1,
                "is_current": True,
                "is_unlisted": False,
                "remix_of": None,
            },  # Block 6
            {
                "track_id": 3,
                "is_current": False,
                "is_unlisted": False,
                "remix_of": None,
            },  # Block 7
            {
                "track_id": 6,
                "is_current": True,
                "is_unlisted": False,
                "remix_of": None,
            },  # Block 8
            {
                "track_id": 4,
                "is_current": True,
                "is_unlisted": False,
                "remix_of": None,
            },  # Block 9
            {
                "track_id": 3,
                "is_current": True,
                "is_unlisted": False,
                "remix_of": None,
            },  # Block 10
            {
                "track_id": 5,
                "is_current": False,
                "is_unlisted": False,
                "remix_of": None,
            },  # Block 11
            {
                "track_id": 5,
                "is_current": True,
                "is_unlisted": False,
                "remix_of": None,
            },  # Block 12
        ],
    }

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        # Make sure it doesn't return tracks if none are passed in
        empty_entries = get_prev_track_entries(session, [])

        assert len(empty_entries) == 0

        # Make sure that it fetches all previous tracks
        entries = [
            Track(track_id=6, blocknumber=8),
            Track(track_id=6, blocknumber=8),
            Track(track_id=3, blocknumber=10),
            Track(track_id=1, blocknumber=6),
            Track(track_id=4, blocknumber=9),
            Track(track_id=5, blocknumber=12),
        ]
        prev_entries = get_prev_track_entries(session, entries)

        assert len(prev_entries) <= len(entries)

        for prev_entry in prev_entries:
            entry = next(e for e in entries if e.track_id == prev_entry.track_id)
            assert entry.track_id == prev_entry.track_id
            assert entry.blocknumber > prev_entry.blocknumber
            # previous track with id 3 should have a block number of 7, not 2
            if prev_entry.track_id == 3:
                assert prev_entry.blocknumber == 7
            # previous track with id 5 should have a block number of 11, not 4
            if prev_entry.track_id == 5:
                assert prev_entry.blocknumber == 11

        # Make sure that it properly fetches the track before the one passed
        single_entry = [Track(track_id=5, blocknumber=11)]
        prev_id_5_track = get_prev_track_entries(session, single_entry)[0]

        assert prev_id_5_track.track_id == 5
        assert prev_id_5_track.blocknumber < 11
