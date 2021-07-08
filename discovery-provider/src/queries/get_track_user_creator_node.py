import logging  # pylint: disable=C0302
from sqlalchemy import and_

from src.models import User, Track
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


def get_track_user_creator_node(args):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Get the track's owner creator node
        user = (
            session.query(User.creator_node_endpoint)
            .join(
                Track,
                and_(
                    Track.owner_id == User.user_id,
                    Track.is_current == True,
                    Track.is_delete == False,
                    Track.is_unlisted == False,
                    Track.track_id == args.get("track_id"),
                ),
            )
            .filter(User.is_current)
            .first()
        )

        if not user:
            return None
        creator_nodes = user[0]
        return creator_nodes
