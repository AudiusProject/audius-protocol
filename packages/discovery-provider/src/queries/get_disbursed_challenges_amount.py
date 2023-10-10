from datetime import datetime, timedelta

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


def get_weekly_pool_window_start(now):
    monday_before_4pm_utc = now.weekday() == 0 and now.hour < 16
    prev_monday = now - timedelta(days=7 if monday_before_4pm_utc else now.weekday())
    prev_monday = prev_monday.replace(hour=16, minute=0, second=0, microsecond=0)
    return prev_monday
