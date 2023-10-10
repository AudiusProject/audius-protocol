from datetime import datetime

from sqlalchemy import BigInteger, cast, func
from sqlalchemy.orm import Session

from src.models.rewards.challenge_disbursement import ChallengeDisbursement


def get_disbursed_challenges_amount(
    session: Session, challenge_id: str, since: datetime
):
    """
    Gets the amount disbursed for a given challenge id since the specified timestamp.
    """
    amount_disbursed = (
        session.query(func.sum(cast(ChallengeDisbursement.amount, BigInteger)))
        .filter(
            ChallengeDisbursement.challenge_id == challenge_id,
            ChallengeDisbursement.created_at > since,
        )
        .scalar()
    )
    return amount_disbursed
