import logging  # pylint: disable=C0302
from datetime import datetime, timedelta

from src.models.indexing.block import Block
from src.models.social.play import Play
from src.models.tracks.track import Track
from src.tasks.generate_trending import get_listen_counts
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


# Setup trending from simplified metadata
def setup_trending(db, date):
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
        {"item_id": 2, "created_at": date - timedelta(weeks=2)},
        {"item_id": 2, "created_at": date - timedelta(weeks=2)},
        {"item_id": 3, "created_at": date - timedelta(weeks=2)},
        # We don't want to count these guys (tracks deleted/unlisted)
        {"item_id": 3},
        {"item_id": 3},
        {"item_id": 4},
        {"item_id": 4},
    ]

    # pylint: disable=W0621
    with db.scoped_session() as session:
        # seed tracks + blocks
        for i, track_meta in enumerate(test_tracks):
            blockhash = hex(i)
            block = Block(
                blockhash=blockhash,
                number=i,
                parenthash="0x01",
                is_current=True,
            )

            track = Track(
                blockhash=blockhash,
                blocknumber=i,
                track_id=i,
                is_current=track_meta.get("is_current", True),
                is_delete=track_meta.get("is_delete", False),
                owner_id=300,
                route_id="",
                track_segments=[],
                genre=track_meta.get("genre", ""),
                updated_at=track_meta.get("updated_at", date),
                created_at=track_meta.get("created_at", date),
                is_unlisted=track_meta.get("is_unlisted", False),
            )

            # add block and then flush before
            # adding track, bc track.blocknumber foreign key
            # references block
            session.query(Block).update({"is_current": False})
            session.add(block)
            session.flush()
            session.add(track)

        # seed plays
        for i, play_meta in enumerate(test_plays):
            item_id = play_meta.get("item_id")
            play = Play(
                id=i, play_item_id=item_id, created_at=play_meta.get("created_at", date)
            )
            session.add(play)


# Helper to sort results before validating
def validate_results(actual, expected):
    assert sorted(actual, key=lambda x: x["track_id"]) == sorted(
        expected, key=lambda x: x["track_id"]
    )


# Tests


def test_get_listen_counts_year(app):
    """Happy path test: test that we get all valid listens from prior year"""
    # setup
    with app.app_context():
        db = get_db()

    date = datetime.now()
    setup_trending(db, date)

    # run
    with db.scoped_session() as session:
        res = get_listen_counts(session, "year", None, 10, 0)

    # validate
    expected = [
        {"track_id": 0, "listens": 2, "created_at": date},
        {"track_id": 1, "listens": 2, "created_at": date},
        {"track_id": 2, "listens": 3, "created_at": date},
    ]
    validate_results(res, expected)


def test_get_listen_counts_week(app):
    """Test slicing by time range"""
    # setup
    with app.app_context():
        db = get_db()

    date = datetime.now()
    setup_trending(db, date)

    # run
    with db.scoped_session() as session:
        res = get_listen_counts(session, "week", None, 10, 0)

    # validate
    expected = [
        {"track_id": 0, "listens": 2, "created_at": date},
        {"track_id": 1, "listens": 2, "created_at": date},
        {"track_id": 2, "listens": 1, "created_at": date},
    ]
    validate_results(res, expected)


def test_get_listen_counts_genre_filtered(app):
    """Test slicing by genre"""
    # setup
    with app.app_context():
        db = get_db()

    date = datetime.now()
    setup_trending(db, date)

    # run
    with db.scoped_session() as session:
        res = get_listen_counts(session, "year", "Pop", 10, 0)

    # validate
    expected = [{"track_id": 1, "listens": 2, "created_at": date}]
    validate_results(res, expected)


def test_get_listen_counts_all_time(app):
    """Test slicing by genre"""
    # setup
    with app.app_context():
        db = get_db()

    date = datetime.now()
    setup_trending(db, date)

    # run
    with db.scoped_session() as session:
        res = get_listen_counts(session, None, None, 10, 0)
        logger.info(res)
        logger.info(res)
        logger.info(res)
        logger.info(res)
        logger.info(res)

    # validate
    expected = [
        {"track_id": 0, "listens": 2, "created_at": date},
        {"track_id": 1, "listens": 2, "created_at": date},
        {"track_id": 2, "listens": 3, "created_at": date},
    ]
    validate_results(res, expected)
