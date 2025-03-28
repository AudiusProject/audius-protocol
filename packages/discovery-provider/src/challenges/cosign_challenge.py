import logging
from typing import Dict

from sqlalchemy.orm.session import Session

from src.challenges.challenge import ChallengeManager, ChallengeUpdater
from src.models.rewards.user_challenge import UserChallenge

logger = logging.getLogger(__name__)


class CosignChallengeUpdater(ChallengeUpdater):
    """
    This challenge is completed when a verified user cosigns a remix.
    The specifier is the track ID.
    """

    def generate_specifier(self, session: Session, user_id: int, extra: Dict) -> str:
        return f"{extra['track_id']}"

    def should_create_new_challenge(
        self, session: Session, event: str, user_id: int, extra: Dict
    ) -> bool:
        """
        Check if a challenge with the given specifier exists.
        Return True if no challenge exists (should create a new one),
        False otherwise.
        """

        existing_challenge = (
            session.query(UserChallenge)
            .filter(
                UserChallenge.challenge_id == "cs",
                UserChallenge.specifier
                == self.generate_specifier(session, user_id, extra),
                UserChallenge.user_id == user_id,
            )
            .first()
        )

        return existing_challenge is None


cosign_challenge_manager = ChallengeManager("cs", CosignChallengeUpdater())
