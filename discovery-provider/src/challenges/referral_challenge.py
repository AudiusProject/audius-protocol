from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm.session import Session
from src.challenges.challenge import (
    ChallengeManager,
    ChallengeUpdater,
    FullEventMetadata,
    UserChallenge,
)
from src.models import User


def generate_referral_specifier(user_id: int, extra: Dict) -> str:
    return f"{user_id}=>{extra['referred_user_id']}"


class ReferralChallengeUpdater(ChallengeUpdater):
    def generate_specifier(self, user_id: int, extra: Dict) -> str:
        return generate_referral_specifier(user_id, extra)

    def should_create_new_challenge(
        self, session, event: str, user_id: int, extra: Dict
    ) -> bool:
        # Only create challenges for unverified users
        unverified_user: Optional[Tuple[int]] = (
            session.query(User.user_id)
            .filter(
                User.user_id == user_id,
                User.is_current == True,
                User.is_verified == False,
            )
            .one_or_none()
        )
        return bool(unverified_user)


class VerifiedReferralChallengeUpdater(ChallengeUpdater):
    def generate_specifier(self, user_id: int, extra: Dict) -> str:
        return generate_referral_specifier(user_id, extra)

    def should_create_new_challenge(
        self, session, event: str, user_id: int, extra: Dict
    ) -> bool:
        # Only create challenges for verified users
        verified_user: Optional[Tuple[int]] = (
            session.query(User.user_id)
            .filter(
                User.user_id == user_id,
                User.is_current == True,
                User.is_verified == True,
            )
            .one_or_none()
        )
        return bool(verified_user)


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
verified_referral_challenge_manager = ChallengeManager(
    "referrals-verified", VerifiedReferralChallengeUpdater()
)

referred_challenge_manager = ChallengeManager("referred", ReferredChallengeUpdater())
