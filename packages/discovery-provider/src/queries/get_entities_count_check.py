from src.models.playlists.playlist import Playlist
from src.models.social.follow import Follow
from src.models.social.repost import Repost
from src.models.social.save import Save
from src.models.tracks.track import Track
from src.models.users.user import User
from src.utils import db_session
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)


def get_entities_count_check():
    """
    Gets counts for each of these entities.
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        user_counts = session.query(User).filter(User.is_current).count()
        track_counts = session.query(Track).filter(Track.is_current).count()
        playlist_counts = session.query(Playlist).filter(Playlist.is_current).count()
        repost_counts = session.query(Repost).filter(Repost.is_current).count()
        save_counts = session.query(Save).filter(Save.is_current).count()
        follow_counts = session.query(Follow).filter(Follow.is_current).count()
        res = {
            "user_counts": user_counts,
            "track_counts": track_counts,
            "playlist_counts": playlist_counts,
            "repost_counts": repost_counts,
            "save_counts": save_counts,
            "follow_counts": follow_counts,
        }
        return res
