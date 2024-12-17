from typing import Dict

from sqlalchemy.orm.session import Session

from src.challenges.challenge import ChallengeManager, ChallengeUpdater


class OneShotChallengeUpdater(ChallengeUpdater):
    def should_create_new_challenge(
        self, session, event: str, user_id: int, extra: Dict
    ) -> bool:
        return False

    def should_show_challenge_for_user(self, session: Session, user_id: int) -> bool:
        return True


one_shot_challenge_manager = ChallengeManager("o", OneShotChallengeUpdater())
