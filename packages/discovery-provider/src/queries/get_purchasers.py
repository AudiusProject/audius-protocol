import logging
from typing import Optional, TypedDict  # pylint: disable=C0302

from src.models.users.usdc_purchase import PurchaseType, USDCPurchase
from src.models.users.user import User
from src.queries.get_unpopulated_users import get_unpopulated_users
from src.queries.query_helpers import add_query_pagination, populate_user_metadata
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


class GetPurchasersArgs(TypedDict):
    seller_user_id: int
    current_user_id: int
    content_type: Optional[PurchaseType]
    content_id: Optional[int]
    limit: int
    offset: int


def _get_purchasers(session, args: GetPurchasersArgs):
    """Fetch users who have purchased content owned by the given user,
    optionally also filtered by the given content type and id.
    """

    content_type = args.get("content_type", None)
    content_id = args.get("content_id", None)
    seller_user_id = args.get("seller_user_id")

    # Get all users that have purchased content from the seller_user_id
    buyers_query = (
        session.query(USDCPurchase.buyer_user_id)
        .distinct()
        .join(User, User.user_id == USDCPurchase.buyer_user_id)
        .filter(USDCPurchase.seller_user_id == seller_user_id)
        .all()
    )

    # Optionally filter by given content type and id
    if content_type:
        buyers_query = buyers_query.filter(USDCPurchase.content_type == content_type)
    if content_id:
        buyers_query = buyers_query.filter(USDCPurchase.content_id == content_id)

    return buyers_query


def get_purchasers_count(args: GetPurchasersArgs):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        query = _get_purchasers(session, args)
        return query.count()


def get_purchasers(args: GetPurchasersArgs):
    purchasers = []
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset")
    db = get_db_read_replica()

    with db.scoped_session() as session:
        query = _get_purchasers(session, args)
        rows = add_query_pagination(query, limit, offset).all()
        purchaser_ids = [r[0] for r in rows]
        purchasers_users = get_unpopulated_users(session, purchaser_ids)
        purchasers = populate_user_metadata(
            session, purchaser_ids, purchasers_users, current_user_id
        )

    return purchasers
