from datetime import datetime
from typing import Dict, List, Optional, cast

from sqlalchemy import and_, func
from sqlalchemy.orm.session import Session

from src.challenges.challenge import (
    ChallengeManager,
    ChallengeUpdater,
    FullEventMetadata,
)
from src.models.rewards.user_challenge import UserChallenge
from src.models.social.play import Play
from src.models.tracks.track import Track
from src.utils.config import shared_config

env = shared_config["discprov"]["env"]

PLAY_MILESTONES = {250: "25", 1000: "100", 10000: "1000"}

if env == "stage" or env == "dev":
    PLAY_MILESTONES = {1: "1", 2: "2", 3: "3"}

FINAL_MILESTONE = max(PLAY_MILESTONES.keys())


class PlayCountMilestonesUpdater(ChallengeUpdater):
    """
    Challenge to reward users for achieving specific play count milestones in 2025.

    The milestones are:
    - 250 plays: 25 AUDIO
    - 1000 plays: 100 AUDIO
    - 10000 plays: 1000 AUDIO

    Each milestone is a separate challenge that is marked as complete when reached.
    """

    def _get_user_play_count_2025(self, session: Session, user_id: int) -> int:
        """Get the total play count for an artist's tracks in 2025"""
        start_date = datetime(2025, 1, 1)
        end_date = datetime(2026, 1, 1)

        play_count = (
            session.query(func.count(Play.id))
            .join(
                Track,
                and_(
                    Track.track_id == Play.play_item_id,
                    Track.owner_id == user_id,
                    Track.is_current == True,
                    Track.is_delete == False,
                ),
            )
            .filter(and_(Play.created_at >= start_date, Play.created_at < end_date))
            .scalar()
        )

        return cast(int, play_count)

    def _get_max_completed_milestone(
        self, session: Session, user_id: int
    ) -> Optional[int]:
        """Get the highest milestone that the user has already completed"""
        completed_challenges = (
            session.query(UserChallenge)
            .filter(
                UserChallenge.challenge_id == "pc",
                UserChallenge.user_id == user_id,
                UserChallenge.is_complete == True,
            )
            .all()
        )
        if not completed_challenges:
            return None
        max_step_count = max(
            challenge.current_step_count
            for challenge in completed_challenges
            if challenge.current_step_count is not None
        )
        sorted_milestones = sorted(PLAY_MILESTONES.keys())
        for milestone in reversed(sorted_milestones):
            if max_step_count >= milestone:
                return milestone
        return None

    def update_user_challenges(
        self,
        session: Session,
        event: str,
        user_challenges: List[UserChallenge],
        step_count: Optional[int],
        event_metadatas: List[FullEventMetadata],
        starting_block: Optional[int],
    ):
        """
        Update user challenges based on their play count milestones.
        This method is called by the ChallengeManager when processing events.
        """
        for user_challenge in user_challenges:
            user_id = user_challenge.user_id
            play_count = self._get_user_play_count_2025(session, user_id)
            max_completed_milestone = self._get_max_completed_milestone(
                session, user_id
            )
            sorted_milestones = sorted(PLAY_MILESTONES.keys())
            milestone = None

            if max_completed_milestone is None:
                milestone = sorted_milestones[0]
            else:
                # Find the next milestone after the highest completed one
                next_index = sorted_milestones.index(max_completed_milestone) + 1
                if next_index < len(sorted_milestones):
                    milestone = sorted_milestones[next_index]
                else:
                    # This is a challenge for a milestone beyond the final one
                    # This shouldn't happen, but if it does, use the final milestone
                    milestone = FINAL_MILESTONE

            if milestone is None:
                continue

            user_challenge.current_step_count = play_count

            if play_count >= milestone:
                user_challenge.amount = int(PLAY_MILESTONES[milestone])
                user_challenge.is_complete = True

    def generate_specifier(self, session: Session, user_id: int, extra: Dict) -> str:
        """
        Generate a unique specifier for the user's challenge.

        Format: hex_user_id_timestamp
        Example: a1b2c3_20250315123045

        Simple temporal specifier without embedding milestone logic.
        """
        max_completed_milestone = self._get_max_completed_milestone(session, user_id)

        # For simplicity, just use timestamp for uniqueness
        timestamp = datetime.now().strftime("%Y%m%d")
        if env == "stage" or env == "dev":
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        key = f"{hex(user_id)[2:]}"

        # If user has already completed the final milestone, don't create a new challenge
        if max_completed_milestone == FINAL_MILESTONE:
            return f"{key}_dummy_{timestamp}"

        return f"{hex(user_id)[2:]}_{timestamp}"

    def should_create_new_challenge(
        self, session: Session, event: str, user_id: int, extra: Dict
    ) -> bool:
        """
        Determine if a new challenge should be created for the user.

        Create a new challenge if:
        1. The user has played tracks in 2025
        2. The user has reached a milestone they haven't completed yet
        3. The user hasn't reached the final milestone yet
        4. The user doesn't already have 3 completed challenges
        """
        # Only proceed if they've played tracks in 2025
        play_count = self._get_user_play_count_2025(session, user_id)
        if play_count <= 0:
            return False

        max_completed_milestone = self._get_max_completed_milestone(session, user_id)

        # If they've already completed the final milestone, don't create more challenges
        if max_completed_milestone == FINAL_MILESTONE:
            return False

        # Count total challenges (completed or not) to ensure we don't create more than 3
        total_challenges = (
            session.query(UserChallenge)
            .filter(
                UserChallenge.challenge_id == "pc",
                UserChallenge.user_id == user_id,
            )
            .count()
        )

        if total_challenges >= len(PLAY_MILESTONES):
            return False

        sorted_milestones = sorted(PLAY_MILESTONES.keys())
        next_milestone = None

        if max_completed_milestone is None:
            # If no milestones completed yet, first milestone is next
            next_milestone = sorted_milestones[0]
        else:
            # Find the next milestone after the highest one they've completed
            next_index = sorted_milestones.index(max_completed_milestone) + 1
            if next_index < len(sorted_milestones):
                next_milestone = sorted_milestones[next_index]

        # If there's no next milestone or they haven't reached it yet, don't create a challenge
        if next_milestone is None or play_count < next_milestone:
            return False

        return True


play_count_milestones_challenge_manager = ChallengeManager(
    "pc", PlayCountMilestonesUpdater()
)
