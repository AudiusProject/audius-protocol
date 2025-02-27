from datetime import datetime
from typing import Dict, List, Optional, cast

from sqlalchemy import and_, func
from sqlalchemy.orm.session import Session

from src.challenges.challenge import (
    ChallengeManager,
    ChallengeUpdater,
    FullEventMetadata,
)
from src.challenges.challenge_event import ChallengeEvent
from src.models.rewards.user_challenge import UserChallenge
from src.models.social.play import Play
from src.models.tracks.track import Track
from src.utils.config import shared_config

env = shared_config["discprov"]["env"]

PLAY_MILESTONES = {250: "25", 1000: "100", 10000: "1000"}
FINAL_MILESTONE = max(PLAY_MILESTONES.keys())

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

    def get_user_play_count_2025(self, session: Session, user_id: int) -> int:
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

    def _get_completed_milestones(self, session: Session, user_id: int) -> List[int]:
        """Get the list of milestones that the user has already completed"""
        completed_challenges = (
            session.query(UserChallenge)
            .filter(
                UserChallenge.challenge_id == "pc",
                UserChallenge.user_id == user_id,
                UserChallenge.is_complete == True,
            )
            .all()
        )

        completed_milestones = []
        for challenge in completed_challenges:
            step_count = challenge.current_step_count
            for milestone in sorted(PLAY_MILESTONES.keys()):
                if step_count is not None and step_count >= milestone:
                    if milestone not in completed_milestones:
                        completed_milestones.append(milestone)

        return completed_milestones

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
        if event != ChallengeEvent.track_played:
            return

        for user_challenge in user_challenges:
            user_id = user_challenge.user_id
            play_count = self.get_user_play_count_2025(session, user_id)
            completed_milestones = self._get_completed_milestones(session, user_id)
            sorted_milestones = sorted(PLAY_MILESTONES.keys())
            milestone = None

            if not completed_milestones:
                milestone = sorted_milestones[0]
            else:
                # Find the next milestone after the highest completed one
                highest_completed = max(completed_milestones)
                next_index = sorted_milestones.index(highest_completed) + 1
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
        completed_milestones = self._get_completed_milestones(session, user_id)

        # If user has already completed the final milestone, don't create a new challenge
        if FINAL_MILESTONE in completed_milestones:
            return f"{hex(user_id)[2:]}_dummy_{datetime.now().strftime('%Y%m%d%H%M%S')}"

        # For simplicity, just use timestamp for uniqueness
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
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
        if event != ChallengeEvent.track_played:
            return False

        # Only proceed if they've played tracks in 2025
        play_count = self.get_user_play_count_2025(session, user_id)
        if play_count <= 0:
            return False

        completed_milestones = self._get_completed_milestones(session, user_id)

        # If they've already completed the final milestone, don't create more challenges
        if FINAL_MILESTONE in completed_milestones:
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

        if not completed_milestones:
            # If no milestones completed yet, first milestone is next
            next_milestone = sorted_milestones[0]
        else:
            # Find the next milestone after the highest one they've completed
            highest_completed = max(completed_milestones)
            next_index = sorted_milestones.index(highest_completed) + 1
            if next_index < len(sorted_milestones):
                next_milestone = sorted_milestones[next_index]

        # If there's no next milestone or they haven't reached it yet, don't create a challenge
        if next_milestone is None or play_count < next_milestone:
            return False

        return True

    def should_show_challenge_for_user(self, session: Session, user_id: int) -> bool:
        """
        Determine if a challenge should be shown to the user
        """
        return True


play_count_milestones_challenge_manager = ChallengeManager(
    "pc", PlayCountMilestonesUpdater()
)
