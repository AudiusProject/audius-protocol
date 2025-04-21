import logging
from datetime import datetime, timedelta
from typing import Dict

from sqlalchemy.orm.session import Session

from src.challenges.challenge import ChallengeManager, ChallengeUpdater
from src.models.rewards.user_challenge import UserChallenge

logger = logging.getLogger(__name__)

MAX_COSIGNS_PER_MONTH = 5


class CosignChallengeUpdater(ChallengeUpdater):
    """
    This challenge is completed when a verified user cosigns a remix.
    The specifier is the track ID.
    """

    def generate_specifier(self, session: Session, user_id: int, extra: Dict) -> str:
        return f"{hex(extra['original_track_owner_id'])[2:]}:{hex(extra['remix_track_id'])[2:]}"

    def should_create_new_challenge(
        self, session: Session, event: str, user_id: int, extra: Dict
    ) -> bool:
        """
        Check if a challenge with the given specifier exists.
        Return True if no challenge exists (should create a new one),
        False otherwise.
        """
        specifier_prefix = f"{hex(extra['original_track_owner_id'])[2:]}"
        one_month_ago = datetime.fromtimestamp(extra["cosign_date"]) - timedelta(
            days=30
        )

        existing_challenge = (
            session.query(UserChallenge)
            .filter(
                UserChallenge.challenge_id == "cs",
                UserChallenge.specifier.like(f"{specifier_prefix}:%"),  # Cosigner
                UserChallenge.created_at >= one_month_ago,
            )
            .all()
        )

        return len(existing_challenge) < MAX_COSIGNS_PER_MONTH


cosign_challenge_manager = ChallengeManager("cs", CosignChallengeUpdater())
