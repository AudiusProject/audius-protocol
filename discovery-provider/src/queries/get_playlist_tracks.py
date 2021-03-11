import logging  # pylint: disable=C0302
import sqlalchemy

from src.models import Playlist, Track
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import populate_track_metadata, add_users_to_tracks

logger = logging.getLogger(__name__)

# TODO: add args
def get_playlist_tracks(args):
    limit = args.get("limit")
    offset = args.get("offset")

    db = get_db_read_replica()
    with db.scoped_session() as session:
        try:
            playlists = args.get("playlists")
            if not playlists:
                playlist_ids = args.get("playlist_ids")
                playlists = (
                    session
                    .query(Playlist)
                    .filter(
                        Playlist.is_current == True,
                        Playlist.playlist_id.in_(playlist_ids)
                    )
                )

            if playlists is None:
                return {}

            # { playlist_id -> [track_id] }
            # playlist_track_ids = {
            #     playlist["playlist_id"]:
            #         [track_id['track'] for track_id in playlist.playlist_contents['track_ids']]
            #     for playlist in playlists
            # }

            # track_id -> [playlist_id]
            track_ids_set = set()
            track_id_map = {}
            for playlist in playlists:
                playlist_id = playlist["playlist_id"]
                for track_id_dict in playlist['playlist_contents']['track_ids']:
                    track_id = track_id_dict['track']
                    track_ids_set.add(track_id)
                    if track_id not in track_id_map:
                        track_id_map[track_id] = [playlist_id]
                    else:
                        track_id_map[track_id].append(playlist_id)

            # TODO:??
            # if limit and offset:
            #     playlist_track_ids = playlist_track_ids[offset:offset+limit]

            playlist_tracks = (
                session
                .query(Track)
                .filter(
                    Track.is_current == True,
                    Track.track_id.in_(list(track_ids_set))
                )
                .all()
            )

            tracks = helpers.query_result_to_list(playlist_tracks)

            # TODO: do this later. Maybe we should
            # populate after?
            # tracks = populate_track_metadata(
            #     session, playlist_track_ids, tracks, current_user_id)

            # TODO: this
            # if args.get("with_users", False):
            #     add_users_to_tracks(session, tracks, current_user_id)

            # { playlist_id => [track]}
            playlists_map = {}
            for track in tracks:
                track_id = track["track_id"]
                parent_playlist_ids = track_id_map[track_id]
                for playlist_id in parent_playlist_ids:
                    if playlist_id not in playlists_map:
                        playlists_map[playlist_id] = [track]
                    else:
                        playlists_map[playlist_id].append(track)

            return playlists_map

        except sqlalchemy.orm.exc.NoResultFound:
            return {}
