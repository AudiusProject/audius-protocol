from typing import Dict, Optional, TypedDict

from src.models.users.collectibles import Collectibles
from src.utils.db_session import get_db_read_replica


class GetCollectiblesArgs(TypedDict):
    user_id: int


def get_collectibles(args: GetCollectiblesArgs) -> Optional[Dict]:
    """Gets the collectibles data for a user.

    Args:
        args: GetCollectiblesArgs containing user_id

    Returns:
        Dict containing collectibles data if found, None otherwise
    """
    db = get_db_read_replica()
    with db.scoped_session() as session:
        collectibles = (
            session.query(Collectibles)
            .filter(Collectibles.user_id == args["user_id"])
            .first()
        )
        if collectibles:
            return collectibles.data
        return None
