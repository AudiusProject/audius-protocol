import logging
from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm.session import Session

from src.challenges.challenge import (
    ChallengeManager,
    ChallengeUpdater,
    FullEventMetadata,
)
from src.models.rewards.challenge import Challenge
from src.models.rewards.user_challenge import UserChallenge
from src.models.users.user import User

logger = logging.getLogger(__name__)


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


def get_challenge_amount(session: Session, challenge_id: str) -> Optional[int]:
    """Get the amount from the Challenge model for a given challenge_id"""
    challenge = session.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        logger.error(f"Farid: Challenge not found for id: {challenge_id}")
        return None
    return int(challenge.amount)


class AudioMatchingBuyerChallengeUpdater(ChallengeUpdater):
    def generate_specifier(self, session: Session, user_id: int, extra: Dict) -> str:
        return generate_audio_matching_specifier(user_id, extra)

    def should_create_new_challenge(
        self, session, event: str, user_id: int, extra: Dict
    ) -> bool:
        return True

    def should_show_challenge_for_user(self, session: Session, user_id: int) -> bool:
        return True

    def update_user_challenges(
        self,
        session: Session,
        event: str,
        user_challenges: List[UserChallenge],
        step_count: Optional[int],
        event_metadatas: List[FullEventMetadata],
        starting_block: Optional[int],
    ):
        challenge_id = user_challenges[0].challenge_id
        challenge_amount = get_challenge_amount(session, challenge_id)
        for idx, user_challenge in enumerate(user_challenges):
            metadata = event_metadatas[idx]
            if metadata and "amount" in metadata["extra"]:
                user_challenge.amount = challenge_amount * metadata["extra"]["amount"]
                user_challenge.is_complete = True


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
