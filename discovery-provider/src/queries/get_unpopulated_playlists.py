import logging  # pylint: disable=C0302
from datetime import datetime

from dateutil import parser
from src.models.playlists.playlist import Playlist
from src.utils import helpers, redis_connection
from src.utils.redis_cache import (
    get_all_json_cached_key,
    get_playlist_id_cache_key,
    set_json_cached_key,
)

logger = logging.getLogger(__name__)

# Cache unpopulated playlists for 5 min
ttl_sec = 5 * 60

playlist_datetime_fields = []
for column in Playlist.__table__.c:
    if column.type.python_type == datetime:
        playlist_datetime_fields.append(column.name)


def get_cached_playlists(playlist_ids):
    redis_playlist_id_keys = list(map(get_playlist_id_cache_key, playlist_ids))
    redis = redis_connection.get_redis()
    playlists = get_all_json_cached_key(redis, redis_playlist_id_keys)
    for playlist in playlists:
        if playlist:
            for field in playlist_datetime_fields:
                if playlist[field]:
                    playlist[field] = parser.parse(playlist[field])
    return playlists


def set_playlists_in_cache(playlists):
    redis = redis_connection.get_redis()
    for playlist in playlists:
        key = get_playlist_id_cache_key(playlist["playlist_id"])
        set_json_cached_key(redis, key, playlist, ttl_sec)


def get_unpopulated_playlists(session, playlist_ids, filter_deleted=False):
    """
    Fetches playlists by checking the redis cache first then
    going to DB and writes to cache if not present

    Args:
        session: DB session
        playlist_ids: array A list of playlist ids

    Returns:
        Array of playlists
    """
    # Check the cached playlists
    cached_playlists_results = get_cached_playlists(playlist_ids)
    has_all_playlists_cached = cached_playlists_results.count(None) == 0
    if has_all_playlists_cached:
        if filter_deleted:
            return list(
                filter(
                    lambda playlist: not playlist["is_delete"], cached_playlists_results
                )
            )
        return cached_playlists_results

    # Create a dict of cached playlists
    cached_playlists = {}
    for cached_playlist in cached_playlists_results:
        if cached_playlist:
            cached_playlists[cached_playlist["playlist_id"]] = cached_playlist

    playlist_ids_to_fetch = filter(
        lambda playlist_id: playlist_id not in cached_playlists, playlist_ids
    )

    playlists_query = (
        session.query(Playlist)
        .filter(Playlist.is_current == True)
        .filter(Playlist.playlist_id.in_(playlist_ids_to_fetch))
    )
    if filter_deleted:
        playlists_query = playlists_query.filter(Playlist.is_delete == False)

    playlists = playlists_query.all()
    playlists = helpers.query_result_to_list(playlists)
    queried_playlists = {playlist["playlist_id"]: playlist for playlist in playlists}

    # cache playlists for future use
    set_playlists_in_cache(playlists)

    playlists_response = []
    for playlist_id in playlist_ids:
        if playlist_id in cached_playlists:
            if not filter_deleted or not cached_playlists[playlist_id]["is_delete"]:
                playlists_response.append(cached_playlists[playlist_id])
        elif playlist_id in queried_playlists:
            playlists_response.append(queried_playlists[playlist_id])

    return playlists_response
