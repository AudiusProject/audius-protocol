from datetime import datetime
from src import models
from src.utils import helpers
from src.utils.db_session import get_db


def query_creator_by_name(app, creator_name=None):
    """Return list of creators filtered by name (if present)"""
    query_results = None
    with app.app_context():
        db = get_db()

        with db.scoped_session() as session:
            if creator_name is not None:
                query_results = (
                    session.query(models.User)
                    .filter(models.User.name == creator_name)
                    .order_by(models.User.user_id)
                    .all()
                )
            else:
                query_results = (
                    session.query(models.User)
                    .order_by(models.User.user_id)
                    .all()
                )

            assert query_results is not None
            return_list = helpers.query_result_to_list(query_results)
            return return_list


def to_bytes(val, length=32):
    val = val[:length]
    return bytes(val, 'utf-8')


def populate_mock_db(db, entities):
    """
    Helper function to populate the mock DB with tracks, users, plays, and follows

    Args:
        db - sqlalchemy db session
        entities - dict of keys tracks, users, plays of arrays of metadata
    """
    with db.scoped_session() as session:
        tracks = entities.get('tracks', [])
        users = entities.get('users', [])
        follows = entities.get('follows', [])
        num_blocks = max(len(tracks), len(users), len(follows))

        for i in range(num_blocks):
            block = models.Block(
                blockhash=hex(i),
                number=i,
                parenthash='0x01',
                is_current=(i == 0),
            )
            session.add(block)
            session.flush()

        for i, track_meta in enumerate(tracks):
            track = models.Track(
                blockhash=hex(i),
                blocknumber=i,
                track_id=track_meta.get("track_id", i),
                is_current=track_meta.get("is_current", True),
                is_delete=track_meta.get("is_delete", False),
                owner_id=track_meta.get("owner_id", 1),
                route_id=track_meta.get("route_id", ''),
                track_segments=track_meta.get("track_segments", []),
                tags=track_meta.get("tags", None),
                genre=track_meta.get("genre", ""),
                updated_at=track_meta.get("updated_at", datetime.now()),
                created_at=track_meta.get("created_at", datetime.now()),
                is_unlisted=track_meta.get("is_unlisted", False)
            )
            session.add(track)

        for i, user_meta in enumerate(users):
            user = models.User(
                blockhash=hex(i),
                blocknumber=1,
                user_id=user_meta.get('user_id', i),
                is_current=True,
                handle=user_meta.get('handle', i),
                wallet=user_meta.get('wallet', i),
                updated_at=user_meta.get("updated_at", datetime.now()),
                created_at=user_meta.get("created_at", datetime.now()),
            )
            session.add(user)

        for i, play_meta in enumerate(entities.get('plays', [])):
            play = models.Play(
                id=play_meta.get("id", i),
                play_item_id=play_meta.get("item_id"),
                created_at=play_meta.get("created_at", datetime.now())
            )
            session.add(play)

        for i, follow_meta in enumerate(follows):
            follow = models.Follow(
                blockhash=hex(i),
                blocknumber=follow_meta.get("blocknumber", i),
                follower_user_id=follow_meta.get("follower_user_id", i + 1),
                followee_user_id=follow_meta.get("followee_user_id", i),
                is_current=follow_meta.get("is_current", True),
                is_delete=follow_meta.get("is_delete", False),
                created_at=follow_meta.get("created_at", datetime.now())
            )
            session.add(follow)
