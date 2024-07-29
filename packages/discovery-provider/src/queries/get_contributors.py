import logging

from sqlalchemy import desc
from sqlalchemy.orm.session import Session

from src.models.crowdfund.crowdfund_contribution import CrowdfundContribution
from src.models.users.user import User
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


def _get_contributors(session: Session, content_id: int, content_type: int):
    query = (
        session.query(User.user_id, CrowdfundContribution.amount)
        .join(User, User.wallet == CrowdfundContribution.ethereum_address)
        .filter(
            CrowdfundContribution.content_id == content_id,
            CrowdfundContribution.content_type == content_type,
        )
        .order_by(desc(CrowdfundContribution.amount), desc(User.user_id))
    )
    return query.all()


def get_contributors(content_id: int, content_type: int):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        contributors = _get_contributors(session, content_id, content_type)
        return [
            {"user_id": user_id, "amount": amount} for (user_id, amount) in contributors
        ]
