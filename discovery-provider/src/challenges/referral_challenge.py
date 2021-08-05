from typing import Dict

from src.challenges.challenge import ChallengeManager, ChallengeUpdater


class ReferralChallengeUpdater(ChallengeUpdater):
    def generate_specifier(self, user_id: int, extra: Dict) -> str:
        return f"{user_id}=>{extra['referred_user_id']}"


class ReferredChallengeUpdater(ChallengeUpdater):
    pass


referral_challenge_manager = ChallengeManager("referrals", ReferralChallengeUpdater())

referred_challenge_manager = ChallengeManager("referred", ReferredChallengeUpdater())
