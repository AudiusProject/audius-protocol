from typing import Dict, List, Optional

from sqlalchemy.orm.session import Session
from sqlalchemy.sql.functions import func
from src.challenges.challenge import (
    ChallengeManager,
    ChallengeUpdater,
    FullEventMetadata,
)
from src.models.models import UserChallenge
from src.models.user_events import UserEvents


class ReferralChallengeUpdater(ChallengeUpdater):
    """Updates a user referral challenge.
    Requires a user to refer N users to complete the challenge
    """

    def update_user_challenges(
        self,
        session: Session,
        event: str,
        user_challenges: List[UserChallenge],
        step_count: Optional[int],
        event_metadatas: List[FullEventMetadata],
        starting_block: Optional[int],
    ):
        pass
        # step_count = step_count if step_count is not None else 0
        # referrer_ids = [user_challenge.user_id for user_challenge in user_challenges]
        # referral_summary = self._get_num_users_referred_by_referrer(
        #     session,
        #     referrer_ids,
        #     starting_block if starting_block is not None else 0,
        # )
        # referral_map = {row.referrer: row.referral_count for row in referral_summary}
        # for user_challenge in user_challenges:
        #     referral_count: Optional[int] = referral_map[user_challenge.user_id]
        #     user_challenge.current_step_count = (
        #         referral_count if referral_count is not None else 0
        #     )
        #     user_challenge.is_complete = user_challenge.current_step_count >= step_count

    def generate_specifier(self, user_id: int, extra: Dict) -> str:
        return f"{user_id}=>{extra['referred_user_id']}"

    # def _get_num_users_referred_by_referrer(
    #     self,
    #     session: Session,
    #     referrer_ids: List[int],
    #     block_number: int,
    # ):
    #     return (
    #         session.query(
    #             UserEvents.referrer,
    #             func.count(UserEvents.user_id).label("referral_count"),
    #         )
    #         .filter(
    #             UserEvents.referrer.in_(referrer_ids),
    #             UserEvents.is_current == True,
    #             UserEvents.blocknumber >= block_number,
    #         )
    #         .group_by(UserEvents.referrer)
    #         .all()
    #     )


class ReferredChallengeUpdater(ChallengeUpdater):
    pass


referral_challenge_manager = ChallengeManager("referrals", ReferralChallengeUpdater())

referred_challenge_manager = ChallengeManager("referred", ReferredChallengeUpdater())
