from src import exceptions
from src.models import Playlist
from src.utils.db_session import get_db_read_replica


def get_previously_private_playlists(args):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        if "date" not in args:
            raise exceptions.ArgumentError(
                "'date' required to query for retrieving previously private playlists"
            )

        date = args.get("date")

        playlist_after_date = (
            session.query(Playlist.playlist_id, Playlist.updated_at)
            .distinct(Playlist.playlist_id)
            .filter(Playlist.is_private == False, Playlist.updated_at >= date)
            .subquery()
        )

        playlist_before_date = (
            session.query(Playlist.playlist_id, Playlist.updated_at)
            .distinct(Playlist.playlist_id)
            .filter(Playlist.is_private == True, Playlist.updated_at < date)
            .subquery()
        )

        previously_private_results = (
            session.query(playlist_before_date.c["playlist_id"])
            .join(
                playlist_after_date,
                playlist_after_date.c["playlist_id"]
                == playlist_before_date.c["playlist_id"],
            )
            .all()
        )

        playlist_ids = [result[0] for result in previously_private_results]

    return {"ids": playlist_ids}
