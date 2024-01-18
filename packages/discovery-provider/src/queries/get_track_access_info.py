from sqlalchemy import and_

from src.models.tracks.track import Track
from src.models.users.user import User
from src.utils import helpers
from src.utils.db_session import get_db_read_replica


def get_track_access_info(track_id: int):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        info = (
            session.query(User.creator_node_endpoint, Track)
            .select_from(User)
            .join(
                Track,
                and_(
                    Track.owner_id == User.user_id,
                    Track.track_id == track_id,
                    Track.is_current == True,
                    Track.is_delete == False,
                ),
            )
            .filter(User.is_current == True)
            .filter(User.is_deactivated == False)
            .first()
        )

        if not info:
            return {"creator_nodes": None, "track": {}}

        return {"creator_nodes": info[0], "track": helpers.model_to_dictionary(info[1])}
