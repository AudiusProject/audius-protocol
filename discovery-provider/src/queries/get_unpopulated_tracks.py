import logging  # pylint: disable=C0302
import pickle

from src.utils import redis_connection
from src.models import Track
from src.utils import helpers
from src.utils.redis_cache import get_track_id_cache_key

logger = logging.getLogger(__name__)

# Cache unpopulated tracks for 5 min
ttl_sec = 5 * 60


def get_cached_tracks(track_ids):
    redis_track_id_keys = map(get_track_id_cache_key, track_ids)
    redis = redis_connection.get_redis()
    cached_values = redis.mget(redis_track_id_keys)

    tracks = []
    for val in cached_values:
        if val is not None:
            try:
                track = pickle.loads(val)
                tracks.append(track)
            except Exception as e:
                logger.warning(f"Unable to deserialize cached track: {e} {val}")
                tracks.append(None)
        else:
            tracks.append(None)
    return tracks


def set_tracks_in_cache(tracks):
    redis = redis_connection.get_redis()
    for track in tracks:
        key = get_track_id_cache_key(track["track_id"])
        serialized = pickle.dumps(track)
        redis.set(key, serialized, ttl_sec)


def get_unpopulated_tracks(
    session, track_ids, filter_deleted=False, filter_unlisted=True
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
            tracks_response.append(cached_tracks[track_id])
        elif track_id in queried_tracks:
            tracks_response.append(queried_tracks[track_id])

    return tracks_response
