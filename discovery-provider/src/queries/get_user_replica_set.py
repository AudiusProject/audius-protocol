import logging
from typing import List

from src.models.users.user import User
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


def get_user_replica_set(args):
    user_id = args.get("user_id")

    db = get_db_read_replica()
    with db.scoped_session() as session:

        # Don't return the user if they have no wallet (user creation did not finish properly on chain)
        users: List[User] = (
            session.query(User)
            .filter(
                User.is_current == True, User.wallet != None, User.user_id == user_id
            )
            .all()
        )
        if len(users) != 1:
            return {}

        user = users[0]
        endpoints = user.creator_node_endpoint.split(",")
        return {
            "user_id": user.user_id,
            "wallet": user.wallet,
            "primary": endpoints[0],
            "secondary1": endpoints[1],
            "secondary2": endpoints[2],
            "primarySpID": user.primary_id,
            "secondary1SpID": user.secondary_ids[0],
            "secondary2SpID": user.secondary_ids[1],
        }
