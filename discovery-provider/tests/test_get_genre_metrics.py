from datetime import datetime, timedelta
from src.models import Block, Track
from src.queries.get_genre_metrics import _get_genre_metrics
from src.utils.db_session import get_db


def populate_mock_db(db, test_tracks):
    """Helper function to populate thee mock DB with plays"""
    with db.scoped_session() as session:
        for i, track_meta in enumerate(test_tracks):
            blockhash = hex(i)
            block = Block(
                blockhash=blockhash,
                number=i,
                parenthash='0x01',
                is_current=(i == 0),
            )
            track = Track(
                blockhash=hex(i),
                blocknumber=i,
                track_id=i,
                is_current=track_meta.get("is_current", True),
                is_delete=track_meta.get("is_delete", False),
                owner_id=300,
                route_id='',
                track_segments=[],
                genre=track_meta.get("genre", ""),
                updated_at=track_meta.get("updated_at", datetime.utcnow()),
                created_at=track_meta.get("created_at", datetime.utcnow()),
                is_unlisted=track_meta.get("is_unlisted", False)
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

    test_tracks = [
      {"genre": "Electronic"},
      {"genre": "Pop"},
      {"genre": "Electronic"}
    ]

    populate_mock_db(db, test_tracks)

    args = {
        'limit': 10,
        'bucket_size': 'hour'
    }

    with db.scoped_session() as session:
        metrics = _get_genre_metrics(session, args)

    assert metrics["Electronic"] == 2
    assert metrics["Pop"] == 1
    

def test_get_genre_metrics_for_month(app):
    """Tests that genre metrics can be queried over a large time range"""
    date = datetime.utcnow()
    before_date = (date + timedelta(days=-12))

    with app.app_context():
        db = get_db()

    test_tracks = [
      {"genre": "Electronic", "created_at": date},
      {"genre": "Pop", "created_at": date},
      {"genre": "Electronic", "created_at": date},
      {"genre": "Electronic", "created_at": before_date},
    ]
    populate_mock_db(db, test_tracks)

    args = {
        'limit': 10,
        'bucket_size': 'hour'
    }

    with db.scoped_session() as session:
        metrics = _get_genre_metrics(session, args)

    assert metrics["Electronic"] == 2
    assert metrics["Pop"] == 1

    args2 = {
        'limit': 10,
        'bucket_size': 'month'
    }

    with db.scoped_session() as session:
        metrics = _get_genre_metrics(session, args2)

    assert metrics["Electronic"] == 3
    assert metrics["Pop"] == 1

