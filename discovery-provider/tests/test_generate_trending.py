from datetime import datetime, timedelta

from src.tasks.generate_trending import get_listen_counts
from src.models import Track, Block, Play

# Test data

# test tracks
# when creating tracks, track_id == index
test_tracks = [
    {"genre": "Electronic"},
    {"genre": "Pop"},
    {"genre": "Electronic"},

    # Tracks we don't want to count
    {"genre": "Electronic", "is_unlisted": True},
    {"genre": "Electronic", "is_delete": True},

]

test_plays = [
    # Current Plays
    {"item_id": 0},
    {"item_id": 0},
    {"item_id": 1},
    {"item_id": 1},
    {"item_id": 2},
    {"item_id": 3},

    # > 1 wk plays
    {"item_id": 2, "created_at": datetime.now() - timedelta(weeks=2)},
    {"item_id": 2, "created_at": datetime.now() - timedelta(weeks=2)},
    {"item_id": 3, "created_at": datetime.now() - timedelta(weeks=2)},

    # We don't want to count these guys (tracks deleted/unlisted)
    {"item_id": 3},
    {"item_id": 3},
    {"item_id": 4},
    {"item_id": 4},
]

# Setup trending from simplified metadata
def setup_trending(db):
    # pylint: disable=W0621
    with db.scoped_session() as session:
        # seed tracks + blocks
        for i, track_meta in enumerate(test_tracks):
            blockhash = hex(i)
            block = Block(
                blockhash=blockhash,
                number=i,
                parenthash='0x01',
                is_current=True,
            )

            track = Track(
                blockhash=blockhash,
                blocknumber=i,
                track_id=i,
                is_current=track_meta.get("is_current", True),
                is_delete=track_meta.get("is_delete", False),
                owner_id=300,
                route_id='',
                track_segments=[],
                genre=track_meta.get("genre", ""),
                updated_at=track_meta.get("updated_at", datetime.now()),
                created_at=track_meta.get("created_at", datetime.now()),
                is_unlisted=track_meta.get("is_unlisted", False)
            )

            # add block and then flush before
            # adding track, bc track.blocknumber foreign key
            # references block
            session.add(block)
            session.flush()
            session.add(track)

        # seed plays
        for i, play_meta in enumerate(test_plays):
            play = Play(
                id=i,
                play_item_id=play_meta.get("item_id"),
                created_at=play_meta.get("created_at", datetime.now())
            )
            session.add(play)


# Helper to sort results before validating
def validate_results(actual, expected):
    sorter = lambda x: x["track_id"]
    assert sorted(actual, key=sorter) == sorted(expected, key=sorter)

# Tests

def test_get_listen_counts_year(postgres_mock_db):
    """Happy path test: test that we get all valid listens from prior year"""
    # setup
    setup_trending(postgres_mock_db)

    # run
    with postgres_mock_db.scoped_session() as session:
        res = get_listen_counts(session, "year", None, 10, 0)

    # validate
    expected = [
        {"track_id": 0, "listens": 2},
        {"track_id": 1, "listens": 2},
        {"track_id": 2, "listens": 3}
    ]
    validate_results(res, expected)

def test_get_listen_counts_week(postgres_mock_db):
    """Test slicing by time range"""
    # setup
    setup_trending(postgres_mock_db)

    # run
    with postgres_mock_db.scoped_session() as session:
        res = get_listen_counts(session, "week", None, 10, 0)

    # validate
    expected = [
        {"track_id": 0, "listens": 2},
        {"track_id": 1, "listens": 2},
        {"track_id": 2, "listens": 1}
    ]
    validate_results(res, expected)

def test_get_listen_counts_genre_filtered(postgres_mock_db):
    """Test slicing by genre"""
    # setup
    setup_trending(postgres_mock_db)

    # run
    with postgres_mock_db.scoped_session() as session:
        res = get_listen_counts(session, "year", "Pop", 10, 0)

    # validate
    expected = [{"track_id": 1, "listens": 2}]
    validate_results(res, expected)
