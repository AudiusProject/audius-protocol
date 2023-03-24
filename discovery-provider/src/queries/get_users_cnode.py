import logging  # pylint: disable=C0302
from enum import Enum

import sqlalchemy
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


class ReplicaType(Enum):
    PRIMARY = 1
    SECONDARY = 2
    ALL = 3


# TODO: Enforce default max_users after all CNs are updated to a version with this PR: https://github.com/AudiusProject/audius-protocol/pull/3064
def get_users_cnode(
    cnode_endpoint_string,
    replica_type,
    prev_user_id,
    max_users,
):
    """
    Query all users with `cnode_endpoint_string` in replica set
    If replica_type=ReplicaType.PRIMARY -> returns users with `cnode_endpoint_string` as primary
    Else if replica_type=ReplicaType.SECONDARY -> returns users with `cnode_endpoint_string` as secondary1 or secondary2
    Else (only other option is replica_type=ReplicaType.ALL)

    Only returns values where 1/2 secondaries are non-null
    """
    users = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        users_res = sqlalchemy.text(
            f"""
            SELECT
              "user_id",
              "wallet",
              "creator_node_endpoint",
              (string_to_array("creator_node_endpoint", ',')) [1] as "primary",
              (string_to_array("creator_node_endpoint", ',')) [2] as "secondary1",
              (string_to_array("creator_node_endpoint", ',')) [3] as "secondary2",
              "primary_id" as "primarySpID",
              ("secondary_ids") [1] as "secondary1SpID",
              ("secondary_ids") [2] as "secondary2SpID"
            FROM "users"
            WHERE
              "creator_node_endpoint" IS NOT NULL
              AND "is_current" IS TRUE
              AND "creator_node_endpoint" like :cnode_like
              AND "secondary_ids" IS NOT NULL
            {
                ""
                if prev_user_id is None
                else
                "AND t.user_id > :prev_user_id"
            }
            ORDER BY "user_id" ASC
            {
                ""
                if max_users is None
                else
                "LIMIT :max_users"
            }
            ;
            """
        )

        # if no replica_type: cnode anywhere in creator_node_endpoint
        cnode_like = "%" + cnode_endpoint_string + "%"
        if replica_type == ReplicaType.PRIMARY:
            # if replica_type primary: at start of creator_node_endpoint
            cnode_like = cnode_endpoint_string + ",%"
        elif replica_type == ReplicaType.SECONDARY:
            # if replica_type secondary: has preceeding comma
            cnode_like = "%," + cnode_endpoint_string + "%"

        users = session.execute(
            users_res,
            {
                "cnode_like": cnode_like,
                "prev_user_id": prev_user_id,
                "max_users": max_users,
            },
        ).fetchall()
        users_dict = [dict(row) for row in users]
    return users_dict
