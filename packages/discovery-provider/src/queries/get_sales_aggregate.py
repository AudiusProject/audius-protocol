from typing import Optional, TypedDict

from sqlalchemy import func

from src.models.users.usdc_purchase import USDCPurchase
from src.queries.query_helpers import add_query_pagination
from src.utils.db_session import get_db_read_replica


class GetSalesAggregateArgs(TypedDict):
    seller_user_id: Optional[int]
    limit: int
    offset: int


def _get_sales_aggregate(session, args: GetSalesAggregateArgs):
    query = (
        session.query(
            USDCPurchase.content_id,
            USDCPurchase.content_type,
            func.count(USDCPurchase.buyer_user_id).label("purchase_count"),
        )
        .filter(USDCPurchase.seller_user_id == args.get("seller_user_id"))
        .group_by(USDCPurchase.content_id, USDCPurchase.content_type)
    )

    return query


def get_sales_aggregate(args: GetSalesAggregateArgs):
    """Aggregates USDCPurchase count by content_id and content_type for a given seller_user_id."""
    db = get_db_read_replica()
    with db.scoped_session() as session:
        query = _get_sales_aggregate(session, args)
        limit = args.get("limit")
        offset = args.get("offset")

        results = add_query_pagination(query, limit, offset).all()
        sales_aggregate_list = [row._asdict() for row in results]

        return sales_aggregate_list
