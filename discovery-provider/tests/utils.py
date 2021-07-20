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
                    session.query(models.User).order_by(models.User.user_id).all()
                )

            assert query_results is not None
            return_list = helpers.query_result_to_list(query_results)
            return return_list


def to_bytes(val, length=32):
    val = val[:length]
    return bytes(val, "utf-8")


def populate_mock_db_blocks(db, min, max):
    """
    Helper function to populate the mock DB with blocks

    Args:
        db - sqlalchemy db session
        min - min block number
        max - max block number
    """
    with db.scoped_session() as session:
        for i in range(min, max):
            block = models.Block(
                blockhash=hex(i),
                number=i,
                parenthash="0x01",
                is_current=(i == 0),
            )
            session.add(block)
            session.flush()


def populate_mock_db(db, entities):
    """
    Helper function to populate the mock DB with tracks, users, plays, and follows

    Args:
        db - sqlalchemy db session
        entities - dict of keys tracks, users, plays of arrays of metadata
    """
    with db.scoped_session() as session:
        tracks = entities.get("tracks", [])
        playlists = entities.get("playlists", [])
        users = entities.get("users", [])
        follows = entities.get("follows", [])
        reposts = entities.get("reposts", [])
        saves = entities.get("saves", [])
        track_routes = entities.get("track_routes", [])
        num_blocks = max(len(tracks), len(users), len(follows))

        for i in range(num_blocks):
            block = models.Block(
                blockhash=hex(i),
                number=i,
                parenthash="0x01",
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
                route_id=track_meta.get("route_id", ""),
                track_segments=track_meta.get("track_segments", []),
                tags=track_meta.get("tags", None),
                genre=track_meta.get("genre", ""),
                updated_at=track_meta.get("updated_at", datetime.now()),
                created_at=track_meta.get("created_at", datetime.now()),
                release_date=track_meta.get("release_date", None),
                is_unlisted=track_meta.get("is_unlisted", False),
            )
            session.add(track)
        for i, playlist_meta in enumerate(playlists):
            playlist = models.Playlist(
                blockhash=hex(i),
                blocknumber=i,
                playlist_id=playlist_meta.get("playlist_id", i),
                is_current=playlist_meta.get("is_current", True),
                is_delete=playlist_meta.get("is_delete", False),
                playlist_owner_id=playlist_meta.get("playlist_owner_id", 1),
                is_album=playlist_meta.get("is_album", False),
                is_private=playlist_meta.get("is_private", False),
                playlist_name=playlist_meta.get("playlist_name", f"playlist_{i}"),
                playlist_contents=playlist_meta.get(
                    "playlist_contents", {"track_ids": []}
                ),
                playlist_image_multihash=playlist_meta.get(
                    "playlist_image_multihash", ""
                ),
                playlist_image_sizes_multihash=playlist_meta.get(
                    "playlist_image_sizes_multihash", ""
                ),
                description=playlist_meta.get("description", f"description_{i}"),
                upc=playlist_meta.get("upc", f"upc_{i}"),
                updated_at=playlist_meta.get("updated_at", datetime.now()),
                created_at=playlist_meta.get("created_at", datetime.now()),
            )
            session.add(playlist)

        for i, user_meta in enumerate(users):
            user = models.User(
                blockhash=hex(i),
                blocknumber=1,
                user_id=user_meta.get("user_id", i),
                is_current=True,
                handle=user_meta.get("handle", i),
                handle_lc=user_meta.get("handle", i).lower(),
                wallet=user_meta.get("wallet", i),
                profile_picture=user_meta.get("profile_picture"),
                profile_picture_sizes=user_meta.get("profile_picture_sizes"),
                cover_photo=user_meta.get("cover_photo"),
                cover_photo_sizes=user_meta.get("cover_photo_sizes"),
                updated_at=user_meta.get("updated_at", datetime.now()),
                created_at=user_meta.get("created_at", datetime.now()),
            )
            session.add(user)

        for i, play_meta in enumerate(entities.get("plays", [])):
            play = models.Play(
                id=play_meta.get("id", i),
                play_item_id=play_meta.get("item_id"),
                created_at=play_meta.get("created_at", datetime.now()),
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
                created_at=follow_meta.get("created_at", datetime.now()),
            )
            session.add(follow)
        for i, repost_meta in enumerate(reposts):
            repost = models.Repost(
                blockhash=hex(i),
                blocknumber=repost_meta.get("blocknumber", i),
                user_id=repost_meta.get("user_id", i + 1),
                repost_item_id=repost_meta.get("repost_item_id", i),
                repost_type=repost_meta.get("repost_type", "track"),
                is_current=repost_meta.get("is_current", True),
                is_delete=repost_meta.get("is_delete", False),
                created_at=repost_meta.get("created_at", datetime.now()),
            )
            session.add(repost)
        for i, save_meta in enumerate(saves):
            save = models.Save(
                blockhash=hex(i),
                blocknumber=save_meta.get("blocknumber", i),
                user_id=save_meta.get("user_id", i + 1),
                save_item_id=save_meta.get("save_item_id", i),
                save_type=save_meta.get("save_type", "track"),
                is_current=save_meta.get("is_current", True),
                is_delete=save_meta.get("is_delete", False),
                created_at=save_meta.get("created_at", datetime.now()),
            )
            session.add(save)
        for i, route_meta in enumerate(track_routes):
            route = models.TrackRoute(
                slug=route_meta.get("slug", ""),
                title_slug=route_meta.get("title_slug", ""),
                blockhash=hex(i),
                blocknumber=route_meta.get("blocknumber", i),
                owner_id=route_meta.get("owner_id", i + 1),
                track_id=route_meta.get("track_id", i + 1),
                is_current=route_meta.get("is_current", True),
                txhash=route_meta.get("txhash", ""),
                collision_id=route_meta.get("collision_id", 0),
            )
            session.add(route)
