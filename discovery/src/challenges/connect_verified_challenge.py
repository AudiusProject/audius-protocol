from typing import List, Optional

from sqlalchemy.orm.session import Session

from src.challenges.challenge import (
    ChallengeManager,
    ChallengeUpdater,
    FullEventMetadata,
)
from src.models.rewards.user_challenge import UserChallenge


class ConnectVerifiedChallengeUpdater(ChallengeUpdater):
    """Updates a connect verified challenge."""

    def update_user_challenges(
        self,
        session: Session,
        event: str,
        user_challenges: List[UserChallenge],
        step_count: Optional[int],
        event_metadatas: List[FullEventMetadata],
        starting_block: Optional[int],
    ):
        # Update the user_challenges
        for user_challenge in user_challenges:
            # Update completion
            user_challenge.is_complete = True


connect_verified_challenge_manager = ChallengeManager(
    "connect-verified", ConnectVerifiedChallengeUpdater()
)
