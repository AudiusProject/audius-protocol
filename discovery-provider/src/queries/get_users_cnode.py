import logging # pylint: disable=C0302
from enum import Enum
import sqlalchemy

from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)

class ReplicaType(Enum):
    PRIMARY = 1
    SECONDARY = 2
    ALL = 3

def get_users_cnode(cnode_endpoint_string, replica_type=ReplicaType.PRIMARY):
    '''
    Query all users with `cnode_endpoint_string` in replica set
    If replica_type=ReplicaType.PRIMARY -> returns users with `cnode_endpoint_string` as primary
    Else if replica_type=ReplicaType.SECONDARY -> returns users with `cnode_endpoint_string` as secondary1 or secondary2
    Else (only other option is replica_type=ReplicaType.ALL)

    Only returns values where 1/2 secondaries are non-null
    '''
    users = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        users_res = sqlalchemy.text(
            f"""
            SELECT
            *
            FROM
            (
                SELECT
                "user_id",
                "wallet",
                ("creator_node_endpoints") [1] as "primary",
                ("creator_node_endpoints") [2] as "secondary1",
                ("creator_node_endpoints") [3] as "secondary2"
                FROM
                (
                    SELECT
                    "user_id",
                    "wallet",
                    string_to_array("creator_node_endpoint", ',') as "creator_node_endpoints"
                    FROM
                    "users"
                    WHERE
                    "creator_node_endpoint" IS NOT NULL
                    AND "is_current" IS TRUE
                    ORDER BY
                    "user_id" ASC
                ) as "s"
            ) as "t"
            WHERE
            {
                "t.primary = :cnode_endpoint_string AND"
                if replica_type == ReplicaType.PRIMARY
                else '(t.secondary1 = :cnode_endpoint_string OR t.secondary2 = :cnode_endpoint_string) AND'
                if replica_type == ReplicaType.SECONDARY
                else '(t.primary = :cnode_endpoint_string OR '
                    't.secondary1 = :cnode_endpoint_string OR '
                    't.secondary2 = :cnode_endpoint_string) AND'
            }
            t.secondary1 is not NULL;
            """
        )
        users = session.execute(
            users_res,
            {"cnode_endpoint_string": cnode_endpoint_string}
        ).fetchall()
        users_dict = [dict(row) for row in users]
    return users_dict
