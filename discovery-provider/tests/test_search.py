from datetime import datetime
from src.models import Track, Block, User
from src.queries.search_queries import track_search_query
from src.utils.db_session import get_db

def setup_search(db):
    # Import app so that it'll run migrations against the db
    now = datetime.now()
    blocks = [
        Block(
            blockhash=hex(1),
            number=1,
            parenthash='0x01',
            is_current=False,
        ),
        Block(
            blockhash=hex(2),
            number=2,
            parenthash='0x02',
            is_current=False,
        ),
        Block(
            blockhash=hex(3),
            number=3,
            parenthash='0x03',
            is_current=True,
        )
    ]
    tracks = [
        Track(
            blockhash=hex(1),
            blocknumber=1,
            track_id=1,
            is_current=True,
            is_delete=False,
            owner_id=1,
            route_id='',
            track_segments=[],
            genre="",
            updated_at=now,
            created_at=now,
            is_unlisted=False,
            title="the track 1",
            download={"cid": None, "is_downloadable": False, "requires_follow": False}
        ),
        Track(
            blockhash=hex(2),
            blocknumber=2,
            track_id=2,
            is_current=True,
            is_delete=False,
            owner_id=2,
            route_id='',
            track_segments=[],
            genre="",
            updated_at=now,
            created_at=now,
            is_unlisted=False,
            title="the track 2",
            download={"cid": None, "is_downloadable": True, "requires_follow": False}
        ),
        Track(
            blockhash=hex(3),
            blocknumber=3,
            track_id=3,
            is_current=True,
            is_delete=False,
            owner_id=1,
            route_id='',
            track_segments=[],
            genre="",
            updated_at=now,
            created_at=now,
            is_unlisted=False,
            title="xyz",
            download={"cid": None, "is_downloadable": True, "requires_follow": False}
        )
    ]

    # need users for the lexeme dict to work
    users = [
        User(
            blockhash=hex(1),
            blocknumber=1,
            user_id=1,
            is_current=True,
            handle="",
            wallet="",
            updated_at=now,
            created_at=now
        ),
        User(
            blockhash=hex(2),
            blocknumber=2,
            user_id=2,
            is_current=True,
            handle="",
            wallet="",
            updated_at=now,
            created_at=now
        ),
        User(
            blockhash=hex(3),
            blocknumber=3,
            user_id=3,
            is_current=True,
            handle="",
            wallet="",
            updated_at=now,
            created_at=now
        )
    ]

    with db.scoped_session() as session:
        for block in blocks:
            session.add(block)
            session.flush()
        for track in tracks:
            session.add(track)
        for user in users:
            session.add(user)
            session.flush()

        # Refresh the lexeme matview
        session.execute("REFRESH MATERIALIZED VIEW aggregate_track;")
        session.execute("REFRESH MATERIALIZED VIEW track_lexeme_dict;")

def test_gets_all_results(app):
    """Tests we get all results, including downloaded"""
    with app.app_context():
        db = get_db()
    setup_search(db)
    with db.scoped_session() as session:
        res = track_search_query(session, "the track", 10, 0, False, False, None, False)
        assert len(res) == 2

def test_gets_downloadable_results(app):
    """Tests we get only downloadable results"""
    with app.app_context():
        db = get_db()
    setup_search(db)
    with db.scoped_session() as session:
        res = track_search_query(session, "the track", 10, 0, False, False, None, True)
        assert len(res) == 1
