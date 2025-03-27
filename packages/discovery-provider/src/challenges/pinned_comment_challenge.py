import logging
from typing import Dict, List, Optional

from sqlalchemy.orm.session import Session

from src.challenges.challenge import (
    ChallengeManager,
    ChallengeUpdater,
    FullEventMetadata,
)
from src.models.rewards.user_challenge import UserChallenge

logger = logging.getLogger(__name__)


def generate_pinned_comment_specifier(user_id: int, track_id: int) -> str:
    """Generate a unique specifier for a pinned comment challenge.
    The specifier combines the user ID and track ID to ensure rewards are only given once per track.
    """
    return f"{hex(user_id)[2:]}:{hex(track_id)[2:]}"


class PinnedCommentChallengeUpdater(ChallengeUpdater):
    """Challenge updater for rewarding users whose comments are pinned by verified artists."""

    def generate_specifier(self, session: Session, user_id: int, extra: Dict) -> str:
        """Generate a unique specifier for this challenge instance."""
        return generate_pinned_comment_specifier(user_id, extra["track_id"])

    def should_create_new_challenge(
        self, session: Session, event: str, user_id: int, extra: Dict
    ) -> bool:
        """Only create the challenge if the artist is verified and the comment
        doesn't belong to the artist themselves."""
        # Check if the artist (track owner) is verified
        artist_is_verified = extra.get("artist_is_verified", False)

        # Check if the comment belongs to a different user than the track owner
        comment_user_id = user_id
        track_owner_id = extra.get("track_owner_id")

        # Only create challenge if artist is verified and comment is from another user
        return artist_is_verified and comment_user_id != track_owner_id

    def update_user_challenges(
        self,
        session: Session,
        event: str,
        user_challenges: List[UserChallenge],
        step_count: Optional[int],
        event_metadatas: List[FullEventMetadata],
        starting_block: Optional[int],
    ):
        """Mark the challenge as complete immediately upon creation."""
        for user_challenge in user_challenges:
            user_challenge.is_complete = True


# Create the challenge manager instance
pinned_comment_challenge_manager = ChallengeManager(
    "cp", PinnedCommentChallengeUpdater()
)
