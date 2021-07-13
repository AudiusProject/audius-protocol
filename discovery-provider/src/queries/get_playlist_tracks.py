import logging  # pylint: disable=C0302
import sqlalchemy

from src.models import Playlist, Track
from src.utils import helpers
from src.queries.query_helpers import populate_track_metadata, add_users_to_tracks

logger = logging.getLogger(__name__)


def get_playlist_tracks(session, args):
    """Accepts args:
    {
        # optionally pass in full playlists to avoid having to fetch
        "playlists": Playlist[]

        # not needed if playlists are passed
        "playlist_ids": string[]
        "current_user_id": int
        "populate_tracks": boolean # whether to add users & metadata to tracks
    }

    Returns: {
        playlist_id: Playlist
    }
    """

    try:
        playlists = args.get("playlists")
        if not playlists:
            playlist_ids = args.get("playlist_ids", [])
            playlists = session.query(Playlist).filter(
                Playlist.is_current == True, Playlist.playlist_id.in_(playlist_ids)
            )
            playlists = list(map(helpers.model_to_dictionary, playlists))

        if not playlists:
            return {}

        # track_id -> [playlist_id]
        track_ids_set = set()
        for playlist in playlists:
            playlist_id = playlist["playlist_id"]
            for track_id_dict in playlist["playlist_contents"]["track_ids"]:
                track_id = track_id_dict["track"]
                track_ids_set.add(track_id)

        playlist_tracks = (
            session.query(Track)
            .filter(Track.is_current == True, Track.track_id.in_(list(track_ids_set)))
            .all()
        )

        tracks = helpers.query_result_to_list(playlist_tracks)

        if args.get("populate_tracks"):
            current_user_id = args.get("current_user_id")
            tracks = populate_track_metadata(
                session, list(track_ids_set), tracks, current_user_id
            )

            add_users_to_tracks(session, tracks, current_user_id)

        # { track_id => track }
        track_ids_map = {track["track_id"]: track for track in tracks}

        # { playlist_id => [track]}
        playlists_map = {}
        for playlist in playlists:
            playlist_id = playlist["playlist_id"]
            playlists_map[playlist_id] = []
            for track_id_dict in playlist["playlist_contents"]["track_ids"]:
                track_id = track_id_dict["track"]
                track = track_ids_map[track_id]
                playlists_map[playlist_id].append(track)

        return playlists_map

    except sqlalchemy.orm.exc.NoResultFound:
        return {}
