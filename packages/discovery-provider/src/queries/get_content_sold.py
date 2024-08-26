import logging
from typing import Optional, TypedDict  # pylint: disable=C0302

from src.models.users.usdc_purchase import PurchaseType, USDCPurchase
from src.models.users.user import User
from src.queries.get_unpopulated_users import get_unpopulated_users
from src.queries.query_helpers import add_query_pagination, populate_user_metadata
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


class GetContentSoldArgs(TypedDict):
    seller_user_id: int
    content_type: Optional[PurchaseType]
    content_id: Optional[int]
    limit: int
    offset: int


def _get_content_sold(session, args: GetContentSoldArgs):
    """Fetch content owned by the user that has been purchased
    at least once.
    """

    seller_user_id = args.get("seller_user_id")

    # Get all users that have purchased content from the seller_user_id
    buyers_query = (
        session.query(USDCPurchase.buyer_user_id)
        .distinct()
        .filter(USDCPurchase.seller_user_id == seller_user_id)
        .all()
    )

    return buyers_query


def get_content_sold(args: GetContentSoldArgs):
    limit = args.get("limit")
    offset = args.get("offset")
    db = get_db_read_replica()

    with db.scoped_session() as session:
        query = _get_content_sold(session, args)
        rows = add_query_pagination(query, limit, offset).all()

    return purchasers
