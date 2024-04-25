import logging
from typing import Dict, List, Optional, TypedDict

from src.models.grants.grant import Grant
from src.utils import db_session
from src.utils.helpers import query_result_to_list

logger = logging.getLogger(__name__)


class GetGrantsArgs(TypedDict):
    user_id: Optional[int]
    grantee_address: Optional[str]
    is_approved: Optional[bool]
    is_revoked: Optional[bool]


def get_grants(args: GetGrantsArgs) -> List[Dict]:
    """
    Returns grants based on one or more provided filters. Must provide either
    user_id or grantee_address.

    Args:
        grantee_address: Optional[str] address of grantee
        user_id: Optional[int] user id of grantor
        is_approved: Optional[bool] whether grant is approved, defaults to True
        is_revoked: Optional[bool] whether grant is revoked, defaults to False

    Returns:
        List of grants
    """
    is_approved = args.get("is_approved", True)
    is_revoked = args.get("is_revoked", False)
    user_id = args.get("user_id")
    grantee_address = args.get("grantee_address")
    if user_id is None and grantee_address is None:
        raise ValueError("Must provide user_id or grantee_address")

    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        base_query = session.query(Grant)

        if grantee_address:
            base_query = base_query.filter(Grant.grantee_address == grantee_address)
        if user_id:
            base_query = base_query.filter(Grant.user_id == user_id)
        base_query.filter(
            Grant.is_current == True,
            Grant.is_revoked == is_revoked,
            Grant.is_approved == is_approved,
        )
        grants = base_query.all()
        return query_result_to_list(grants)
