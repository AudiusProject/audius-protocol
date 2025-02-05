from typing import Dict, Optional, TypedDict

from src.models.users.collectibles_data import CollectiblesData
from src.utils.db_session import get_db_read_replica


class GetCollectiblesDataArgs(TypedDict):
    user_id: int


def get_collectibles_data(args: GetCollectiblesDataArgs) -> Optional[Dict]:
    """Gets the collectibles data for a user.

    Args:
        args: GetCollectiblesDataArgs containing user_id

    Returns:
        Dict containing collectibles data if found, None otherwise
    """
    db = get_db_read_replica()
    with db.scoped_session() as session:
        collectibles = (
            session.query(CollectiblesData)
            .filter(CollectiblesData.user_id == args["user_id"])
            .first()
        )
        if collectibles:
            return collectibles.data
        return None
