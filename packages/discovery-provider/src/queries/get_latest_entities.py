from sqlalchemy import desc

from src import exceptions
from src.models.playlists.playlist import Playlist
from src.models.tracks.track import Track
from src.models.users.user import User
from src.queries.query_helpers import add_query_pagination
from src.utils.db_session import get_db_read_replica


def get_latest_entities(type, args):
    limit = args["limit"]
    offset = args["offset"]

    if type not in ["track", "playlist", "user"]:
        raise exceptions.ArgumentError(
            "Invalid type provided, must be one of 'track', 'playlist', 'user'"
        )

    db = get_db_read_replica()
    with db.scoped_session() as session:
        base_query = None

        if type == "track":
            base_query = (
                session.query(Track.track_id)
                .filter(Track.is_unlisted == False)
                .filter(Track.is_current == True)
                .filter(Track.stream_conditions.is_(None))
                # order must be deterministic
                .order_by(desc(Track.created_at), desc(Track.track_id))
            )

        if type == "playlist":
            base_query = (
                session.query(Playlist.playlist_id)
                .filter(Playlist.is_private == False)
                .filter(Playlist.is_current == True)
                .order_by(desc(Playlist.created_at), desc(Playlist.playlist_id))
            )

        # user
        if type == "user":
            base_query = (
                session.query(User.user_id)
                .filter(User.is_current == True)
                .order_by(desc(User.created_at), desc(User.user_id))
            )

        query_results = add_query_pagination(base_query, limit, offset).all()
        query_results = [query_result[0] for query_result in query_results]
        return query_results[0] if len(query_results) == 1 else query_results
