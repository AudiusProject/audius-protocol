import logging
from datetime import datetime

from src.models.tracks.track import Track
from src.utils import helpers

logger = logging.getLogger(__name__)


track_datetime_fields = []
for column in Track.__table__.c:
    if column.type.python_type == datetime:
        track_datetime_fields.append(column.name)


def get_unpopulated_tracks(
    session,
    track_ids,
    filter_deleted=False,
    filter_unlisted=True,
    exclude_gated=False,
):
    """
    Fetches tracks by checking the redis cache first then
    going to DB and writes to cache if not present

    Args:
        session: DB session
        track_ids: array A list of track ids
        filter_deleted: boolean indicating whether to filter out deleted tracks
        filter_unlisted: boolean indicating whether to filter out unlisted tracks
        exclude_gated: boolean indicating whether to filter out gated tracks

    Returns:
        Array of tracks
    """

    tracks_query = (
        session.query(Track)
        .filter(Track.is_current == True, Track.stem_of == None)
        .filter(Track.track_id.in_(track_ids))
    )

    if filter_unlisted:
        tracks_query = tracks_query.filter(Track.is_unlisted == False)

    if filter_deleted:
        tracks_query = tracks_query.filter(Track.is_delete == False)

    if exclude_gated:
        tracks_query = tracks_query.filter(Track.stream_conditions.is_(None))

    tracks = tracks_query.all()
    tracks = helpers.query_result_to_list(tracks)
    queried_tracks = {track["track_id"]: track for track in tracks}

    # cache tracks for future use

    tracks_response = []
    for track_id in track_ids:
        if track_id in queried_tracks:
            tracks_response.append(queried_tracks[track_id])

    return tracks_response
