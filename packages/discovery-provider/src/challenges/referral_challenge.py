from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm.session import Session

from src.challenges.challenge import (
    ChallengeManager,
    ChallengeUpdater,
    FullEventMetadata,
    UserChallenge,
)
from src.models.users.user import User


def generate_referral_specifier(user_id: int, extra: Dict) -> str:
    return f"{hex(user_id)[2:]}:{hex(extra['referred_user_id'])[2:]}"


def does_user_exist_with_verification_status(
    session, user_id: int, is_verified: bool
) -> bool:
    user: Optional[Tuple[int]] = (
        session.query(User.user_id)
        .filter(
            User.user_id == user_id,
            bool(User.is_current),
            User.is_verified == is_verified,
        )
        .one_or_none()
    )
    return bool(user)


class ReferralChallengeUpdater(ChallengeUpdater):
    def generate_specifier(self, session: Session, user_id: int, extra: Dict) -> str:
        return generate_referral_specifier(user_id, extra)

    def should_create_new_challenge(
        self, session, event: str, user_id: int, extra: Dict
    ) -> bool:
        return does_user_exist_with_verification_status(session, user_id, False)

    def should_show_challenge_for_user(self, session: Session, user_id: int) -> bool:
        return does_user_exist_with_verification_status(session, user_id, False)


class VerifiedReferralChallengeUpdater(ChallengeUpdater):
    def generate_specifier(self, session: Session, user_id: int, extra: Dict) -> str:
        return generate_referral_specifier(user_id, extra)

    def should_create_new_challenge(
        self, session, event: str, user_id: int, extra: Dict
    ) -> bool:
        return does_user_exist_with_verification_status(session, user_id, True)

    def should_show_challenge_for_user(self, session: Session, user_id: int) -> bool:
        return does_user_exist_with_verification_status(session, user_id, True)


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


referral_challenge_manager = ChallengeManager("r", ReferralChallengeUpdater())
verified_referral_challenge_manager = ChallengeManager(
    "rv", VerifiedReferralChallengeUpdater()
)

referred_challenge_manager = ChallengeManager("rd", ReferredChallengeUpdater())
