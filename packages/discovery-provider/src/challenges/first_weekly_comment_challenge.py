import logging
from datetime import datetime
from typing import Dict

from sqlalchemy.orm.session import Session

from src.challenges.challenge import ChallengeManager, ChallengeUpdater
from src.models.rewards.user_challenge import UserChallenge

logger = logging.getLogger(__name__)


class FirstWeeklyCommentChallengeUpdater(ChallengeUpdater):
    """First weekly comment challenge

    This challenge is completed when a user posts their first comment of the week.
    The specifier is generated as a combination of user_id and the year+week number.
    """

    def generate_specifier(self, session: Session, user_id: int, extra: Dict) -> str:
        """
        Generate a specifier for the challenge based on user_id and the current week.
        Format: {user_id}:{year}{week_number}
        """
        date = datetime.fromtimestamp(extra["created_at"])
        year, week_number, _ = date.isocalendar()
        specifier = f"{user_id}:{year}{week_number:02d}"
        return specifier

    def should_create_new_challenge(
        self, session: Session, event: str, user_id: int, extra: Dict
    ) -> bool:
        """
        Check if a challenge with the given specifier exists.
        Return True if no challenge exists (should create a new one),
        False otherwise.
        """
        specifier = self.generate_specifier(session, user_id, extra)
        existing_challenge = (
            session.query(UserChallenge)
            .filter(
                UserChallenge.challenge_id == "c",
                UserChallenge.specifier == specifier,
                UserChallenge.user_id == user_id,
            )
            .first()
        )

        return existing_challenge is None


first_weekly_comment_challenge_manager = ChallengeManager(
    "c", FirstWeeklyCommentChallengeUpdater()
)
