import logging # pylint: disable=C0302
from datetime import datetime
from sqlalchemy import func, desc
from src.models import Playlist, Save, SaveType, RepostType, Follow
from src.tasks.generate_trending import time_delta_map
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import get_repost_counts, get_karma, get_save_counts, \
     populate_playlist_metadata, get_users_ids, get_users_by_id
from src.queries import response_name_constants
from src.queries.get_trending_tracks import z
from src.queries.get_unpopulated_playlists import get_unpopulated_playlists
from src.utils.redis_cache import use_redis_cache

logger = logging.getLogger(__name__)

TRENDING_LIMIT = 100
TRENDING_TTL_SEC = 30 * 60

def get_scorable_playlist_data(session, time_range):
    """Gets data about playlists to be scored. Returns:
        Array<{
            "playlist_id": number
            "created_at": string
            "owner_id": string
            "windowed_save_count": number
            "save_count": number
            "repost_count: number,
            "windowed_repost_count: number
            "listens": number (always 1)
        }>
    """
    delta = time_delta_map.get(time_range) or time_delta_map.get('week')

    # Get all playlists saved within time range (windowed_save_count):
    # Queries by Playlists Joined with Saves,
    # where a given playlist was saved at least once in the past `time_delta`.
    # Limits to `TRENDING_LIMIT` and sorts by saves for later scoring.
    playlists = (
        session.query(
            Save.save_item_id,
            Playlist.created_at,
            Playlist.playlist_owner_id,
            func.count(Save.save_item_id)
        )
        .join(Playlist, Playlist.playlist_id == Save.save_item_id)
        .filter(
            Save.is_current == True,
            Save.is_delete == False,
            Save.save_type == SaveType.playlist,
            Save.created_at > datetime.now() - delta,
            Playlist.is_current == True,
            Playlist.is_delete == False,
            Playlist.is_private == False,
        )
        .group_by(Save.save_item_id, Playlist.created_at, Playlist.playlist_owner_id)
        .order_by(desc(func.count(Save.save_item_id)))
        .limit(TRENDING_LIMIT)
    ).all()

    # Build up a map of playlist data
    # Some fields initialized at zero
    playlist_map = {record[0]: {
        response_name_constants.playlist_id: record[0],
        response_name_constants.created_at: record[1].isoformat(timespec='seconds'),
        response_name_constants.owner_id: record[2],
        response_name_constants.windowed_save_count: record[3],
        response_name_constants.save_count: 0,
        response_name_constants.repost_count: 0,
        response_name_constants.windowed_repost_count: 0,
        "listens": 1,
    } for record in playlists}

    playlist_ids = [record[0] for record in playlists]
    playlist_owner_ids = [record[2] for record in playlists]

    # Add repost counts
    repost_counts = get_repost_counts(session, False, False, playlist_ids, [RepostType.playlist])
    for (playlist_id, repost_count) in repost_counts:
        playlist_map[playlist_id][response_name_constants.repost_count] = repost_count

    # Add windowed repost counts
    repost_counts_for_time = get_repost_counts(
        session,
        False,
        False,
        playlist_ids,
        [RepostType.playlist],
        None,
        time_range
    )
    for (playlist_id, repost_count) in repost_counts_for_time:
        playlist_map[playlist_id][response_name_constants.windowed_repost_count] = repost_count

    # Add save counts
    save_counts = get_save_counts(session, False, False, playlist_ids, [SaveType.playlist])
    for (playlist_id, save_count) in save_counts:
        playlist_map[playlist_id][response_name_constants.save_count] = save_count

    # Add follower counts
    follower_counts = (
        session.query(
            Follow.followee_user_id,
            func.count(Follow.followee_user_id)
        )
        .filter(
            Follow.is_current == True,
            Follow.is_delete == False,
            Follow.followee_user_id.in_(playlist_owner_ids)
        )
        .group_by(Follow.followee_user_id)
        .all()
    )
    follower_count_dict = {record[0]: record[1] for record in follower_counts}
    for playlist in playlist_map.values():
        owner_id = playlist[response_name_constants.owner_id]
        follower_count = follower_count_dict[owner_id]
        playlist[response_name_constants.owner_follower_count] = follower_count

    # Add karma
    karma_scores = get_karma(session, tuple(playlist_ids), None, True)
    for (playlist_id, karma) in karma_scores:
        playlist_map[playlist_id]["karma"] = karma

    return playlist_map.values()

def make_get_unpopulated_playlists(session, time_range):
    """Gets scorable data, scores and sorts, then returns full unpopulated playlists.
       Returns a function, because this is used in a Redis cache hook"""
    def wrapped():
        playlist_scoring_data = get_scorable_playlist_data(session, time_range)

        # score the playlists
        scored_playlists = [z(time_range, playlist) for playlist in playlist_scoring_data]
        sorted_playlists = sorted(scored_playlists, key=lambda k: k['score'], reverse=True)

        # Get the unpopulated playlist metadata
        playlist_ids = [playlist["playlist_id"] for playlist in sorted_playlists]
        playlists = get_unpopulated_playlists(session, playlist_ids)

        return (playlists, playlist_ids)
    return wrapped

def make_trending_cache_key(time_range):
    return f"generated-trending-playlists:{time_range}"

def get_trending_playlists(args):
    """Returns Trending Playlists. Checks Redis cache for unpopulated playlists."""
    db = get_db_read_replica()
    with db.scoped_session() as session:
        current_user_id = args.get("current_user_id", None)
        with_users = args.get("with_users", False)
        time = args.get("time")
        key = make_trending_cache_key(time)

        # Get unpopulated playlists,
        # cached if it exists.
        (playlists, playlist_ids) = use_redis_cache(
            key,
            None,
            make_get_unpopulated_playlists(session, time)
        )

        # Populate playlist metadata
        playlists = populate_playlist_metadata(
            session,
            playlist_ids,
            playlists,
            [RepostType.playlist, RepostType.album],
            [SaveType.playlist, SaveType.album],
            current_user_id
        )

        # re-sort them to original order, because populate_playlist_metadata
        # unsorts.
        playlists_map = {playlist['playlist_id']: playlist for playlist in playlists}
        sorted_playlists = [playlists_map[playlist_id] for playlist_id in playlist_ids]

        # Add users if we requested
        # (always requested for `full` endpoint)
        if with_users:
            user_id_list = get_users_ids(sorted_playlists)
            users = get_users_by_id(session, user_id_list, current_user_id)
            for playlist in sorted_playlists:
                user = users[playlist['playlist_owner_id']]
                if user:
                    playlist['user'] = user

        return sorted_playlists
