from datetime import datetime, timedelta

from src.models.indexing.block import Block
from src.models.tracks.track import Track
from src.queries.get_genre_metrics import _get_genre_metrics
from src.utils.db_session import get_db


def populate_mock_db(db, test_tracks, date):
    """Helper function to populate thee mock DB with plays"""
    with db.scoped_session() as session:
        for i, track_meta in enumerate(test_tracks):
            blockhash = hex(i)
            block = Block(
                blockhash=blockhash,
                number=i,
                parenthash="0x01",
                is_current=(i == 0),
            )
            track = Track(
                blockhash=hex(i),
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
                release_date=track_meta.get("release_date", date),
                is_unlisted=track_meta.get("is_unlisted", False),
            )
            # add block and then flush before
            # adding track, bc track.blocknumber foreign key
            # references block
            session.add(block)
            session.flush()
            session.add(track)


def test_get_genre_metrics(app):
    """Tests that genre metrics can be queried"""
    with app.app_context():
        db = get_db()

    test_tracks = [{"genre": "Electronic"}, {"genre": "Pop"}, {"genre": "Electronic"}]

    date = datetime(2020, 10, 4, 10, 35, 0)
    before_date = date + timedelta(hours=-1)
    populate_mock_db(db, test_tracks, date)

    args = {"start_time": before_date}

    with db.scoped_session() as session:
        metrics = _get_genre_metrics(session, args)

    assert metrics[0]["name"] == "Electronic"
    assert metrics[0]["count"] == 2
    assert metrics[1]["name"] == "Pop"
    assert metrics[1]["count"] == 1


def test_get_genre_metrics_for_month(app):
    """Tests that genre metrics can be queried over a large time range"""
    date = datetime(2020, 10, 4, 10, 35, 0)
    long_before_date = date + timedelta(days=-12)
    before_date = date + timedelta(days=-1)

    with app.app_context():
        db = get_db()

    test_tracks = [
        {"genre": "Electronic", "created_at": date},
        {"genre": "Pop", "created_at": date},
        {"genre": "Electronic", "created_at": date},
        {"genre": "Electronic", "created_at": before_date},
    ]
    populate_mock_db(db, test_tracks, date)

    args = {"start_time": before_date}

    with db.scoped_session() as session:
        metrics = _get_genre_metrics(session, args)

    assert metrics[0]["name"] == "Electronic"
    assert metrics[0]["count"] == 2
    assert metrics[1]["name"] == "Pop"
    assert metrics[1]["count"] == 1

    args2 = {"start_time": long_before_date}

    with db.scoped_session() as session:
        metrics = _get_genre_metrics(session, args2)

    assert metrics[0]["name"] == "Electronic"
    assert metrics[0]["count"] == 3
    assert metrics[1]["name"] == "Pop"
    assert metrics[1]["count"] == 1
