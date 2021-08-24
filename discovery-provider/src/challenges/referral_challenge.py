from typing import Dict, List, Optional

from sqlalchemy.orm.session import Session
from src.challenges.challenge import (
    ChallengeManager,
    ChallengeUpdater,
    FullEventMetadata,
    UserChallenge,
)


class ReferralChallengeUpdater(ChallengeUpdater):
    def generate_specifier(self, user_id: int, extra: Dict) -> str:
        return f"{user_id}=>{extra['referred_user_id']}"


class ReferredChallengeUpdater(ChallengeUpdater):
    def update_user_challenges(
        self,
        session: Session,
        event: str,
        user_challenges: List[UserChallenge],
        step_count: Optional[int],
        event_metadatas: List[FullEventMetadata],
        starting_block: Optional[int],
    ):
        for user_challenge in user_challenges:
            user_challenge.is_complete = True


referral_challenge_manager = ChallengeManager("referrals", ReferralChallengeUpdater())

referred_challenge_manager = ChallengeManager("referred", ReferredChallengeUpdater())
