from typing import Dict, Optional, Tuple

from sqlalchemy.orm.session import Session

from src.challenges.challenge import ChallengeManager, ChallengeUpdater
from src.models.users.user import User


def generate_audio_matching_specifier(user_id: int, extra: Dict) -> str:
    return f"{hex(user_id)[2:]}:{hex(extra['track_id'])[2:]}"


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


class AudioMatchingBuyerChallengeUpdater(ChallengeUpdater):
    def generate_specifier(self, session: Session, user_id: int, extra: Dict) -> str:
        return generate_audio_matching_specifier(user_id, extra)

    def should_create_new_challenge(
        self, session, event: str, user_id: int, extra: Dict
    ) -> bool:
        return True

    def should_show_challenge_for_user(self, session: Session, user_id: int) -> bool:
        return True


class AudioMatchingSellerChallengeUpdater(ChallengeUpdater):
    def generate_specifier(self, session: Session, user_id: int, extra: Dict) -> str:
        return generate_audio_matching_specifier(extra["sender_user_id"], extra)

    def should_create_new_challenge(
        self, session, event: str, user_id: int, extra: Dict
    ) -> bool:
        return does_user_exist_with_verification_status(session, user_id, True)

    def should_show_challenge_for_user(self, session: Session, user_id: int) -> bool:
        return does_user_exist_with_verification_status(session, user_id, True)


audio_matching_buyer_challenge_manager = ChallengeManager(
    "b", AudioMatchingBuyerChallengeUpdater()
)
audio_matching_seller_challenge_manager = ChallengeManager(
    "s", AudioMatchingSellerChallengeUpdater()
)
