from datetime import datetime

from sqlalchemy.sql.elements import SavepointClause
from src.models import Track, Block, User, Follow, Playlist, Save, SaveType
from src.queries.search_queries import playlist_search_query, track_search_query, user_search_query
from src.tasks.index_aggregate_user import UPDATE_AGGREGATE_USER_QUERY
from src.utils.db_session import get_db


def setup_search(db):
    # Import app so that it'll run migrations against the db
    now = datetime.now()
    blocks = [
        Block(
            blockhash=hex(1),
            number=1,
            parenthash="0x01",
            is_current=False,
        ),
        Block(
            blockhash=hex(2),
            number=2,
            parenthash="0x02",
            is_current=False,
        ),
        Block(
            blockhash=hex(3),
            number=3,
            parenthash="0x03",
            is_current=True,
        ),
    ]
    tracks = [
        Track(
            blockhash=hex(1),
            blocknumber=1,
            track_id=1,
            is_current=True,
            is_delete=False,
            owner_id=1,
            route_id="",
            track_segments=[],
            genre="",
            updated_at=now,
            created_at=now,
            is_unlisted=False,
            title="the track 1",
            download={"cid": None, "is_downloadable": False, "requires_follow": False},
        ),
        Track(
            blockhash=hex(2),
            blocknumber=2,
            track_id=2,
            is_current=True,
            is_delete=False,
            owner_id=2,
            route_id="",
            track_segments=[],
            genre="",
            updated_at=now,
            created_at=now,
            is_unlisted=False,
            title="the track 2",
            download={"cid": None, "is_downloadable": True, "requires_follow": False},
        ),
        Track(
            blockhash=hex(3),
            blocknumber=3,
            track_id=3,
            is_current=True,
            is_delete=False,
            owner_id=1,
            route_id="",
            track_segments=[],
            genre="",
            updated_at=now,
            created_at=now,
            is_unlisted=False,
            title="xyz",
            download={"cid": None, "is_downloadable": True, "requires_follow": False},
        ),
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
            name="user 1",
            updated_at=now,
            created_at=now,
        ),
        User(
            blockhash=hex(2),
            blocknumber=2,
            user_id=2,
            is_current=True,
            handle="",
            name="user 2",
            wallet="",
            updated_at=now,
            created_at=now,
        ),
        User(
            blockhash=hex(3),
            blocknumber=3,
            user_id=3,
            is_current=True,
            handle="",
            wallet="",
            name="fdwea",
            updated_at=now,
            created_at=now,
        ),
    ]

    follows = [
        Follow(
            blockhash=hex(1),
            blocknumber=1,
            follower_user_id=2,
            followee_user_id=1,
            is_current=True,
            is_delete=False,
            created_at=now
        )
    ]

    playlists = [
        Playlist(
            blockhash=hex(1),
            blocknumber=1,
            playlist_id=1,
            playlist_owner_id=1,
            is_album=False,
            is_private=False,
            playlist_name="playlist 1",
            playlist_contents={"track_ids": [{"track": 1}]},
            is_current=True,
            is_delete=False,
            updated_at=now,
            created_at=now
        ),
        Playlist(
            blockhash=hex(2),
            blocknumber=2,
            playlist_id=2,
            playlist_owner_id=2,
            is_album=True,
            is_private=False,
            playlist_name="album 1",
            playlist_contents={"track_ids": [{"track": 2}]},
            is_current=True,
            is_delete=False,
            updated_at=now,
            created_at=now
        )
    ]

    saves = [
        Save(
            blockhash=hex(1),
            blocknumber=1,
            user_id=1,
            save_item_id=1,
            save_type=SaveType.track,
            created_at=now,
            is_current=True,
            is_delete=False
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
        for follow in follows:
            session.add(follow)
            session.flush()
        for playlist in playlists:
            session.add(playlist)
            session.flush()
        for save in saves:
            session.add(save)
            session.flush()

        # Refresh the lexeme matview
        session.execute("REFRESH MATERIALIZED VIEW aggregate_track;")
        session.execute("REFRESH MATERIALIZED VIEW track_lexeme_dict;")

        session.execute(
            UPDATE_AGGREGATE_USER_QUERY, {"most_recent_indexed_aggregate_block": 0}
        )
        session.execute("REFRESH MATERIALIZED VIEW user_lexeme_dict;")

        session.execute("REFRESH MATERIALIZED VIEW aggregate_playlist;")
        session.execute("REFRESH MATERIALIZED VIEW playlist_lexeme_dict;")
        session.execute("REFRESH MATERIALIZED VIEW album_lexeme_dict;")


def test_gets_tracks_external(app):
    """Tests we get all tracks, including downloaded"""
    with app.app_context():
        db = get_db()
    setup_search(db)
    with db.scoped_session() as session:
        res = track_search_query(session, "the track", 10, 0, False, None, False)
        assert len(res["all"]) == 2
        assert len(res["saved"]) == 0

def test_get_tracks_internal(app):
    """Tests we get all tracks, including downloaded"""
    with app.app_context():
        db = get_db()
    setup_search(db)
    with db.scoped_session() as session:
        res = track_search_query(session, "the track", 10, 0, False, 1, False)
        assert len(res["all"]) == 2
        assert len(res["saved"]) == 1

def test_gets_downloadable_tracks(app):
    """Tests we get only downloadable results"""
    with app.app_context():
        db = get_db()
    setup_search(db)
    with db.scoped_session() as session:
        res = track_search_query(session, "the track", 10, 0, False, None, True)
        assert len(res["all"]) == 1

def test_gets_all_users(app):
    """Tests we get all users"""
    with app.app_context():
        db = get_db()
    setup_search(db)
    with db.scoped_session() as session:
        res = user_search_query(session, "user", 10, 0, False, None)
        assert len(res["all"]) == 2


def test_gets_followed_users(app):
    """Tests we get followed users"""
    with app.app_context():
        db = get_db()
    setup_search(db)
    with db.scoped_session() as session:
        res = user_search_query(session, "user", 10, 0, False, 2)
        assert len(res["followed"]) == 1

def test_gets_all_playlists(app):
    """Tests we get all playlists"""
    with app.app_context():
        db = get_db()
    setup_search(db)
    with db.scoped_session() as session:
        res = playlist_search_query(session, "playlist", 10, 0, False, False, None)
        assert len(res["all"]) == 1

def test_gets_all_albums(app):
    """Tests we get all albums"""
    with app.app_context():
        db = get_db()
    setup_search(db)
    with db.scoped_session() as session:
        res = playlist_search_query(session, "album", 10, 0, True, False, None)
        assert len(res["all"]) == 1
