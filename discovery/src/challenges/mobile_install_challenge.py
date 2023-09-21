from typing import List, Optional

from sqlalchemy.orm.session import Session

from src.challenges.challenge import (
    ChallengeManager,
    ChallengeUpdater,
    FullEventMetadata,
    UserChallenge,
)


class MobileInstallChallengeUpdater(ChallengeUpdater):
    def update_user_challenges(
        self,
        session: Session,
        event: str,
        user_challenges: List[UserChallenge],
        step_count: Optional[int],
        event_metadatas: List[FullEventMetadata],
        starting_block: Optional[int],
    ):
        # We only fire the event if the user logged in on mobile
        for user_challenge in user_challenges:
            user_challenge.is_complete = True


mobile_install_challenge_manager = ChallengeManager(
    "mobile-install", MobileInstallChallengeUpdater()
)
