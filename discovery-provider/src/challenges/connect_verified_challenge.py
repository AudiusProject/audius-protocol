from collections import Counter
from typing import List
from src.challenges.challenge import (
    ChallengeManager,
    ChallengeUpdater,
)


class ConnectVerifiedChallengeUpdater(ChallengeUpdater):
    """Updates a connect verified challenge."""

    def update_user_challenges(
        self, session, event, user_challenges, step_count, event_metadatas
    ):
        # Update the user_challenges
        for user_challenge in user_challenges:
            # Update completion
            user_challenge.is_complete = True


connect_verified_challenge_manager = ChallengeManager(
    "connect-verified", ConnectVerifiedChallengeUpdater()
)
