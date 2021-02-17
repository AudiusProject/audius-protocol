import logging  # pylint: disable=C0302
import sqlalchemy

from src.models import Playlist, Track
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import populate_track_metadata, add_users_to_tracks

logger = logging.getLogger(__name__)

def get_playlist_tracks(args):
    playlists = []
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset")

    db = get_db_read_replica()
    with db.scoped_session() as session:
        try:
            playlist_id = args.get("playlist_id")
            playlist = (
                session
                .query(Playlist)
                .filter(
                    Playlist.is_current == True,
                    Playlist.playlist_id == playlist_id
                )
                .first()
            )
            if playlist is None:
                return None

            playlist_track_ids = [track_id['track']
                                  for track_id in playlist.playlist_contents['track_ids']]
            if limit and offset:
                playlist_track_ids = playlist_track_ids[offset:offset+limit]

            playlist_tracks = (
                session
                .query(Track)
                .filter(
                    Track.is_current == True,
                    Track.track_id.in_(playlist_track_ids)
                )
                .all()
            )

            tracks = helpers.query_result_to_list(playlist_tracks)
            tracks = populate_track_metadata(
                session, playlist_track_ids, tracks, current_user_id)

            if args.get("with_users", False):
                add_users_to_tracks(session, tracks, current_user_id)

            tracks_dict = {track['track_id']: track for track in tracks}

            playlist_tracks = []
            for track_id in playlist_track_ids:
                playlist_tracks.append(tracks_dict[track_id])

            return playlist_tracks

        except sqlalchemy.orm.exc.NoResultFound:
            pass
    return playlists
