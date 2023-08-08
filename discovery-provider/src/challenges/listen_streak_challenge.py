from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy.orm.session import Session

from src.challenges.challenge import (
    ChallengeManager,
    ChallengeUpdater,
    FullEventMetadata,
)
from src.challenges.challenge_event import ChallengeEvent
from src.models.rewards.listen_streak_challenge import ChallengeListenStreak
from src.models.rewards.user_challenge import UserChallenge


def get_listen_streak_override(session: Session, user_id: int) -> Optional[int]:
    user_listen_challenge = (
        session.query(ChallengeListenStreak)
        .filter(ChallengeListenStreak.user_id == user_id)
        .first()
    )

    if user_listen_challenge is None or user_listen_challenge.last_listen_date is None:
        return None

    # If last_listen_date is over 48 hrs, return zero
    current_datetime = datetime.now()
    if current_datetime - user_listen_challenge.last_listen_date >= timedelta(days=2):
        return 0
    return None


class ChallengeListenStreakUpdater(ChallengeUpdater):
    """Listening streak challenge"""

    def update_user_challenges(
        self,
        session: Session,
        event: str,
        user_challenges: List[UserChallenge],
        step_count: Optional[int],
        event_metadatas: List[FullEventMetadata],
        starting_block: Optional[int],
    ):
        if step_count is None:
            raise Exception("Expected a step count for listen streak challenge")

        user_ids = [user_challenge.user_id for user_challenge in user_challenges]
        partial_completions = get_listen_streak_challenges(session, user_ids)
        completion_map = {
            completion.user_id: completion for completion in partial_completions
        }

        if event == ChallengeEvent.track_listen:
            self._handle_track_listens(partial_completions, event_metadatas)

        # Update the user_challenges
        for user_challenge in user_challenges:
            matching_partial_challenge = completion_map[user_challenge.user_id]
            # Update step count
            user_challenge.current_step_count = matching_partial_challenge.listen_streak
            # Update completion
            user_challenge.is_complete = user_challenge.current_step_count >= step_count

    def on_after_challenge_creation(
        self, session: Session, metadatas: List[FullEventMetadata]
    ):
        listen_streak_challenges = [
            ChallengeListenStreak(
                user_id=metadata["user_id"],
                last_listen_date=None,
                listen_streak=0,
            )
            for metadata in metadatas
        ]
        session.add_all(listen_streak_challenges)

    # Helpers
    def _handle_track_listens(
        self,
        partial_completions: List[ChallengeListenStreak],
        event_metadatas: List[FullEventMetadata],
    ):
        for idx, partial_completion in enumerate(partial_completions):
            last_date = partial_completion.last_listen_date
            new_date = datetime.fromtimestamp(
                event_metadatas[idx]["extra"]["created_at"]
            )

            # If last timestamp is None, start streak now
            if last_date is None:
                partial_completion.last_listen_date = new_date
                partial_completion.listen_streak = 1
            # If last timestamp is more than 24 hours ago, update streak
            elif new_date - last_date >= timedelta(days=1):
                partial_completion.last_listen_date = new_date
                # Check if the user lost their streak
                if new_date - last_date >= timedelta(days=2):
                    partial_completion.listen_streak = 1
                else:
                    partial_completion.listen_streak += 1

    def get_override_challenge_step_count(
        self, session: Session, user_id: int
    ) -> Optional[int]:
        return get_listen_streak_override(session, user_id)


listen_streak_challenge_manager = ChallengeManager(
    "listen-streak", ChallengeListenStreakUpdater()
)


# Accessors
def get_listen_streak_challenges(
    session: Session, user_ids: List[int]
) -> List[ChallengeListenStreak]:
    return (
        session.query(ChallengeListenStreak)
        .filter(ChallengeListenStreak.user_id.in_(user_ids))
        .all()
    )
