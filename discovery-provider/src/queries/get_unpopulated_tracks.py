import logging
from datetime import datetime

from dateutil import parser
from src.models.tracks.track import Track
from src.utils import helpers, redis_connection
from src.utils.redis_cache import (
    get_all_json_cached_key,
    get_track_id_cache_key,
    set_json_cached_key,
)

logger = logging.getLogger(__name__)

# Cache unpopulated tracks for 5 min
ttl_sec = 5 * 60

track_datetime_fields = []
for column in Track.__table__.c:
    if column.type.python_type == datetime:
        track_datetime_fields.append(column.name)


def get_cached_tracks(track_ids):
    redis_track_id_keys = list(map(get_track_id_cache_key, track_ids))
    redis = redis_connection.get_redis()
    tracks = get_all_json_cached_key(redis, redis_track_id_keys)
    for track in tracks:
        if track:
            for field in track_datetime_fields:
                if track[field]:
                    track[field] = parser.parse(track[field])
    return tracks


def set_tracks_in_cache(tracks):
    redis = redis_connection.get_redis()
    for track in tracks:
        key = get_track_id_cache_key(track["track_id"])
        set_json_cached_key(redis, key, track, ttl_sec)


def get_unpopulated_tracks(
    session,
    track_ids,
    filter_deleted=False,
    filter_unlisted=True,
    exclude_premium=False,
):
    """
    Fetches tracks by checking the redis cache first then
    going to DB and writes to cache if not present

    Args:
        session: DB session
        track_ids: array A list of track ids

    Returns:
        Array of tracks
    """
    # Check the cached tracks
    cached_tracks_results = get_cached_tracks(track_ids)
    has_all_tracks_cached = cached_tracks_results.count(None) == 0
    if has_all_tracks_cached:
        res = cached_tracks_results
        if filter_deleted:
            res = list(filter(lambda track: not track["is_delete"], res))
        if filter_unlisted:
            res = list(filter(lambda track: not track["is_unlisted"], res))
        if exclude_premium:
            res = list(filter(lambda track: not track["is_premium"], res))
        return res

    # Create a dict of cached tracks
    cached_tracks = {}
    for cached_track in cached_tracks_results:
        if cached_track:
            cached_tracks[cached_track["track_id"]] = cached_track

    track_ids_to_fetch = filter(
        lambda track_id: track_id not in cached_tracks, track_ids
    )

    tracks_query = (
        session.query(Track)
        .filter(Track.is_current == True, Track.stem_of == None)
        .filter(Track.track_id.in_(track_ids_to_fetch))
    )

    if filter_unlisted:
        tracks_query = tracks_query.filter(Track.is_unlisted == False)

    if filter_deleted:
        tracks_query = tracks_query.filter(Track.is_delete == False)

    if exclude_premium:
        tracks_query = tracks_query.filter(Track.is_premium == False)

    tracks = tracks_query.all()
    tracks = helpers.query_result_to_list(tracks)
    queried_tracks = {track["track_id"]: track for track in tracks}

    # cache tracks for future use
    set_tracks_in_cache(tracks)

    tracks_response = []
    for track_id in track_ids:
        if track_id in cached_tracks:
            if filter_unlisted and cached_tracks[track_id]["is_unlisted"]:
                continue
            if filter_deleted and cached_tracks[track_id]["is_delete"]:
                continue
            if exclude_premium and cached_tracks[track_id]["is_premium"]:
                continue
            tracks_response.append(cached_tracks[track_id])
        elif track_id in queried_tracks:
            tracks_response.append(queried_tracks[track_id])

    return tracks_response
