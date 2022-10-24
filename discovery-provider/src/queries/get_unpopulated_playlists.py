import logging  # pylint: disable=C0302
from datetime import datetime

from src.models.playlists.playlist import Playlist
from src.utils import helpers

logger = logging.getLogger(__name__)

# Cache unpopulated playlists for 5 min

playlist_datetime_fields = []
for column in Playlist.__table__.c:
    if column.type.python_type == datetime:
        playlist_datetime_fields.append(column.name)


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

    playlists_query = (
        session.query(Playlist)
        .filter(Playlist.is_current == True)
        .filter(Playlist.playlist_id.in_(playlist_ids))
    )
    if filter_deleted:
        playlists_query = playlists_query.filter(Playlist.is_delete == False)

    playlists = playlists_query.all()
    playlists = helpers.query_result_to_list(playlists)
    queried_playlists = {playlist["playlist_id"]: playlist for playlist in playlists}

    playlists_response = []
    for playlist_id in playlist_ids:
        if playlist_id in queried_playlists:
            playlists_response.append(queried_playlists[playlist_id])

    return playlists_response
