from datetime import datetime

from src import models
from src.tasks.index_aggregate_user import UPDATE_AGGREGATE_USER_QUERY
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


def populate_mock_db(db, entities, block_offset=0):
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
        remixes = entities.get("remixes", [])
        stems = entities.get("stems", [])
        challenges = entities.get("challenges", [])
        user_challenges = entities.get("user_challenges", [])
        plays = entities.get("plays", [])
        aggregate_plays = entities.get("aggregate_plays", [])
        aggregate_interval_plays = entities.get("aggregate_interval_plays", [])
        indexing_checkpoints = entities.get("indexing_checkpoints", [])
        user_listening_history = entities.get("user_listening_history", [])
        hourly_play_counts = entities.get("hourly_play_counts", [])

        num_blocks = max(len(tracks), len(users), len(follows), len(saves))
        for i in range(block_offset, block_offset + num_blocks):
            max_block = (
                session.query(models.Block).filter(models.Block.number == i).first()
            )
            session.query(models.Block).filter(models.Block.is_current == True).update(
                {"is_current": False}
            )
            if not max_block:
                block = models.Block(
                    blockhash=hex(i),
                    number=i,
                    parenthash="0x01",
                    is_current=(i == block_offset + num_blocks - 1),
                )
                session.add(block)
                session.flush()

        for i, track_meta in enumerate(tracks):
            track = models.Track(
                blockhash=hex(i + block_offset),
                blocknumber=i + block_offset,
                track_id=track_meta.get("track_id", i),
                title=track_meta.get("title", f"track_{i}"),
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
                blockhash=hex(i + block_offset),
                blocknumber=i + block_offset,
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
                blockhash=hex(i + block_offset),
                blocknumber=i + block_offset,
                user_id=user_meta.get("user_id", i),
                is_current=True,
                handle=user_meta.get("handle", str(i)),
                handle_lc=user_meta.get("handle", str(i)).lower(),
                wallet=user_meta.get("wallet", str(i)),
                bio=user_meta.get("bio", str(i)),
                profile_picture=user_meta.get("profile_picture"),
                profile_picture_sizes=user_meta.get("profile_picture_sizes"),
                cover_photo=user_meta.get("cover_photo"),
                cover_photo_sizes=user_meta.get("cover_photo_sizes"),
                updated_at=user_meta.get("updated_at", datetime.now()),
                created_at=user_meta.get("created_at", datetime.now()),
            )
            session.add(user)

        for i, follow_meta in enumerate(follows):
            follow = models.Follow(
                blockhash=hex(i + block_offset),
                blocknumber=follow_meta.get("blocknumber", i + block_offset),
                follower_user_id=follow_meta.get("follower_user_id", i + 1),
                followee_user_id=follow_meta.get("followee_user_id", i),
                is_current=follow_meta.get("is_current", True),
                is_delete=follow_meta.get("is_delete", False),
                created_at=follow_meta.get("created_at", datetime.now()),
            )
            session.add(follow)
        for i, repost_meta in enumerate(reposts):
            repost = models.Repost(
                blockhash=hex(i + block_offset),
                blocknumber=repost_meta.get("blocknumber", i + block_offset),
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
                blockhash=hex(i + block_offset),
                blocknumber=save_meta.get("blocknumber", i + block_offset),
                user_id=save_meta.get("user_id", i + 1),
                save_item_id=save_meta.get("save_item_id", i),
                save_type=save_meta.get("save_type", "track"),
                is_current=save_meta.get("is_current", True),
                is_delete=save_meta.get("is_delete", False),
                created_at=save_meta.get("created_at", datetime.now()),
            )
            session.add(save)

        for i, play_meta in enumerate(plays):
            play = models.Play(
                id=play_meta.get("id", i + 1),
                user_id=play_meta.get("user_id", i + 1),
                source=play_meta.get("source", None),
                play_item_id=play_meta.get("item_id", i + 1),
                slot=play_meta.get("slot", i + 1),
                signature=play_meta.get("signature", None),
                created_at=play_meta.get("created_at", datetime.now()),
                updated_at=play_meta.get("updated_at", datetime.now()),
            )
            session.add(play)

        for i, aggregate_play_meta in enumerate(aggregate_plays):
            aggregate_play = models.AggregatePlays(
                play_item_id=aggregate_play_meta.get("play_item_id", i),
                count=aggregate_play_meta.get("count", 0),
            )
            session.add(aggregate_play)

        for i, aggregate_interval_play_meta in enumerate(aggregate_interval_plays):
            aggregate_interval_play = models.AggregateIntervalPlay(
                track_id=aggregate_interval_play_meta.get("track_id", i),
                created_at=aggregate_interval_play_meta.get(
                    "created_at", datetime.now()
                ),
                week_listen_counts=aggregate_interval_play_meta.get(
                    "week_listen_counts", 0
                ),
                month_listen_counts=aggregate_interval_play_meta.get(
                    "month_listen_counts", 0
                ),
            )
            session.add(aggregate_interval_play)

        for i, user_listening_history_meta in enumerate(user_listening_history):
            user_listening_history = models.UserListeningHistory(
                user_id=user_listening_history_meta.get("user_id", i + 1),
                listening_history=user_listening_history_meta.get(
                    "listening_history", None
                ),
            )
            session.add(user_listening_history)

        for i, hourly_play_count_meta in enumerate(hourly_play_counts):
            hourly_play_count = models.HourlyPlayCounts(
                hourly_timestamp=hourly_play_count_meta.get(
                    "hourly_timestamp", datetime.now()
                ),
                play_count=hourly_play_count_meta.get("play_count", 0),
            )
            session.add(hourly_play_count)

        if indexing_checkpoints:
            session.execute(
                "TRUNCATE TABLE indexing_checkpoints"
            )  # clear primary keys before adding
            for i, indexing_checkpoint_meta in enumerate(indexing_checkpoints):
                indexing_checkpoint = models.IndexingCheckpoints(
                    tablename=indexing_checkpoint_meta.get("tablename", None),
                    last_checkpoint=indexing_checkpoint_meta.get("last_checkpoint", 0),
                )
                session.add(indexing_checkpoint)

        for i, route_meta in enumerate(track_routes):
            route = models.TrackRoute(
                slug=route_meta.get("slug", ""),
                title_slug=route_meta.get("title_slug", ""),
                blockhash=hex(i + block_offset),
                blocknumber=route_meta.get("blocknumber", i + block_offset),
                owner_id=route_meta.get("owner_id", i + 1),
                track_id=route_meta.get("track_id", i + 1),
                is_current=route_meta.get("is_current", True),
                txhash=route_meta.get("txhash", ""),
                collision_id=route_meta.get("collision_id", 0),
            )
            session.add(route)

        for i, remix_meta in enumerate(remixes):
            remix = models.Remix(
                parent_track_id=remix_meta.get("parent_track_id", i),
                child_track_id=remix_meta.get("child_track_id", i + 1),
            )
            session.add(remix)
        for i, stems_meta in enumerate(stems):
            stem = models.Stem(
                parent_track_id=stems_meta.get("parent_track_id", i),
                child_track_id=stems_meta.get("child_track_id", i + 1),
            )
            session.add(stem)

        for i, challenge_meta in enumerate(challenges):
            challenge = models.Challenge(
                id=challenge_meta.get("id", ""),
                type=challenge_meta.get("type", ""),
                amount=challenge_meta.get("amount", ""),
                active=challenge_meta.get("active", True),
                step_count=challenge_meta.get("step_count", None),
                starting_block=challenge_meta.get("starting_block", None),
            )
            session.add(challenge)
        for i, user_challenge_meta in enumerate(user_challenges):
            user_challenge = models.UserChallenge(
                challenge_id=user_challenge_meta.get("challenge_id", ""),
                user_id=user_challenge_meta.get("user_id", 1),
                specifier=user_challenge_meta.get("specifier", ""),
                is_complete=user_challenge_meta.get("is_complete", False),
                completed_blocknumber=user_challenge_meta.get(
                    "completed_blocknumber", 1 + block_offset
                ),
                current_step_count=user_challenge_meta.get("current_step_count", None),
            )
            session.add(user_challenge)

        session.flush()

        session.execute(
            UPDATE_AGGREGATE_USER_QUERY, {"most_recent_indexed_aggregate_block": 0}
        )
