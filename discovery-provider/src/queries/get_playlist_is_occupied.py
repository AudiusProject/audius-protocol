import logging  # pylint: disable=C0302

from sqlalchemy.orm import Session
from src.models.playlists.playlist import Playlist
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


def get_playlist_is_occupied(playlist_id: int):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        return _get_playlist_is_occupied(session, playlist_id)


def _get_playlist_is_occupied(session: Session, playlist_id: int):
    x = session.query(
        session.query(Playlist)
        .filter(Playlist.is_current == True, Playlist.playlist_id == playlist_id)
        .exists()
    )
    logger.info(x)
    logger.info(x)
    logger.info(x)

    playlist_exists = session.query(
        session.query(Playlist)
        .filter(Playlist.is_current == True, Playlist.playlist_id == playlist_id)
        .exists()
    ).scalar()
    return playlist_exists
