import logging
from typing import Dict

from sqlalchemy.orm.session import Session

from src.challenges.challenge import ChallengeManager, ChallengeUpdater

logger = logging.getLogger(__name__)


class TastemakerChallengeUpdater(ChallengeUpdater):
    """Tastemaker challenge

    This challenge is completed when a user reposts or saves a track that later lands in the top 5 trending tracks.
    """

    def generate_specifier(self, session: Session, user_id: int, extra: Dict) -> str:
        """
        Generate a specifier for the challenge based on user_id and tastemaker_item_id
        Format: {user_id}:{tastemaker_item_type}:{tastemaker_item_id}
        """
        item_type = "p" if extra["tastemaker_item_type"] == "playlist" else "t"
        return f"{user_id}:{item_type}:{extra['tastemaker_item_id']}"


tastemaker_challenge_manager = ChallengeManager("t", TastemakerChallengeUpdater())
