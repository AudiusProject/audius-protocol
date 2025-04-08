import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from sqlalchemy.orm.session import Session

from src.challenges.challenge import (
    ChallengeManager,
    ChallengeUpdater,
    FullEventMetadata,
)
from src.challenges.challenge_event import ChallengeEvent
from src.models.core.core_indexed_blocks import CoreIndexedBlocks
from src.models.rewards.listen_streak_challenge import ChallengeListenStreak
from src.models.rewards.user_challenge import UserChallenge
from src.utils.config import shared_config

logger = logging.getLogger(__name__)
env = shared_config["discprov"]["env"]

NUM_DAYS_IN_STREAK = 7
RANGE_START_HOURS = 16
RANGE_END_HOURS = 48
next_streak_timedelta = timedelta(hours=RANGE_START_HOURS)
broken_streak_timedelta = timedelta(hours=RANGE_END_HOURS)

# Targeting 2025-03-27
LISTEN_STREAK_NEW_SPECIFIER_START_BLOCK_PROD = 800000
# Targeting 2025-03-27
LISTEN_STREAK_NEW_SPECIFIER_START_BLOCK_STAGE = 1200000
LISTEN_STREAK_NEW_SPECIFIER_START_BLOCK_DEV = 0


LISTEN_STREAK_NEW_SPECIFIER_START_CHAIN_ID_PROD = "audius-mainnet-alpha-beta"
LISTEN_STREAK_NEW_SPECIFIER_START_CHAIN_ID_STAGE = "audius-testnet-alpha"
LISTEN_STREAK_NEW_SPECIFIER_START_CHAIN_ID_DEV = "audius-devnet"


def get_listen_streak_new_specifier_start_block() -> int:
    env = shared_config["discprov"]["env"]
    if env == "dev":
        return LISTEN_STREAK_NEW_SPECIFIER_START_BLOCK_DEV
    if env == "stage":
        return LISTEN_STREAK_NEW_SPECIFIER_START_BLOCK_STAGE
    return LISTEN_STREAK_NEW_SPECIFIER_START_BLOCK_PROD


def get_listen_streak_new_specifier_start_chain_id() -> str:
    env = shared_config["discprov"]["env"]
    if env == "dev":
        return LISTEN_STREAK_NEW_SPECIFIER_START_CHAIN_ID_DEV
    if env == "stage":
        return LISTEN_STREAK_NEW_SPECIFIER_START_CHAIN_ID_STAGE
    return LISTEN_STREAK_NEW_SPECIFIER_START_CHAIN_ID_PROD


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
    if (
        current_datetime - user_listen_challenge.last_listen_date
        >= broken_streak_timedelta
    ):
        return 0
    return None


class ChallengeListenEndlessStreakUpdater(ChallengeUpdater):
    """Endless listening streak challenge"""

    def _get_current_listen_streak(
        self, session: Session, user_id: int, extra: Dict
    ) -> Optional[UserChallenge]:
        created_at = datetime.fromtimestamp(extra["created_at"])
        most_recent_challenge = get_most_recent_listen_streak_user_challenge(
            session, [user_id]
        )
        listen_streaks = get_listen_streak_challenges(session, [user_id])
        listen_streak = listen_streaks[0] if listen_streaks else None
        time_since_last_listen = (
            created_at - listen_streak.last_listen_date
            if listen_streak is not None and listen_streak.last_listen_date is not None
            else None
        )

        # This is a bit tricky:
        if (
            most_recent_challenge is not None
            and time_since_last_listen is not None
            and (
                # Don't create a new user_challenge row if there is an existing incomplete 7-day listen
                # streak row that's within the last 48 hours, because we want to update that row instead.
                # is_complete == False means the most_recent_challenge is a 7-day row.
                (
                    not most_recent_challenge.is_complete
                    and time_since_last_listen <= broken_streak_timedelta
                )
                # If the user has already completed the 7-day challenge, and the next user_challenge row
                # is going to be a 1-amount row, we should create that row only if the new play event is
                # outside the 16-hour window since the last listen date. See the comment above _handle_track_listens
                # for more details.
                # is_complete == True means the most_recent_challenge is a 1-day challenge.
                or (
                    most_recent_challenge.is_complete
                    and time_since_last_listen <= next_streak_timedelta
                )
            )
        ):
            return most_recent_challenge
        return None

    def generate_specifier(self, session: Session, user_id: int, extra: Dict) -> str:
        recent_challenge = self._get_current_listen_streak(session, user_id, extra)
        if recent_challenge is not None:
            return recent_challenge.specifier

        # Otherwise, create a new specifier
        block = (
            session.query(CoreIndexedBlocks)
            .filter(
                CoreIndexedBlocks.chain_id
                == get_listen_streak_new_specifier_start_chain_id()
            )
            .order_by(CoreIndexedBlocks.height.desc())
            .first()
        )
        created_at = datetime.fromtimestamp(extra["created_at"])
        old_formatted_date = created_at.strftime("%Y%m%d")
        old_specifier = f"{hex(user_id)[2:]}:{old_formatted_date}"
        if (
            not block
            or not block.height
            or block.height < get_listen_streak_new_specifier_start_block()
        ):
            return old_specifier

        new_formatted_date = created_at.strftime("%Y%m%d%H")
        new_specifier = f"{hex(user_id)[2:]}{new_formatted_date}"
        return new_specifier

    def should_create_new_challenge(
        self, session: Session, event: str, user_id: int, extra: Dict
    ) -> bool:
        current_listen_streak = self._get_current_listen_streak(session, user_id, extra)
        if current_listen_streak:
            return False
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
            # For endless streak challenges - these rows should only have amount/step_count = 1
            if (
                matching_partial_challenge.listen_streak > NUM_DAYS_IN_STREAK
                and user_challenge.current_step_count == 0
            ):
                user_challenge.amount = 1
                user_challenge.current_step_count = 1
                user_challenge.is_complete = True
            # For first 7-day listen streak challenge - amount/step_count get updated as streak progresses
            else:
                user_challenge.amount = NUM_DAYS_IN_STREAK
                user_challenge.current_step_count = (
                    matching_partial_challenge.listen_streak
                )
                user_challenge.is_complete = (
                    user_challenge.current_step_count >= NUM_DAYS_IN_STREAK
                )

    def on_after_challenge_creation(
        self, session: Session, metadatas: List[FullEventMetadata]
    ):

        # Get all user_ids from the metadatas
        user_ids = [metadata["user_id"] for metadata in metadatas]

        # Query existing records
        existing_challenges = (
            session.query(ChallengeListenStreak.user_id)
            .filter(ChallengeListenStreak.user_id.in_(user_ids))
            .all()
        )
        existing_user_ids = {user_id for (user_id,) in existing_challenges}

        # Create new records only for users that don't have one
        new_listen_streak_challenges = [
            ChallengeListenStreak(
                user_id=metadata["user_id"],
                last_listen_date=None,
                listen_streak=0,
            )
            for metadata in metadatas
            if metadata["user_id"] not in existing_user_ids
        ]

        if new_listen_streak_challenges:
            session.add_all(new_listen_streak_challenges)

    # Note that the ChallengeListenStreak table doesn't necessarily contain the user's most recent
    # listen date. It only updates the last listen date if the new play event is more than 24 hours
    # since the last listen date.
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
            # If last timestamp is more than 16 hours ago, update streak.
            elif new_date - last_date >= next_streak_timedelta:
                partial_completion.last_listen_date = new_date
                # Check if the user lost their streak
                if new_date - last_date >= broken_streak_timedelta:
                    partial_completion.listen_streak = 1
                else:
                    partial_completion.listen_streak += 1

    def get_override_challenge_step_count(
        self, session: Session, user_id: int
    ) -> Optional[int]:
        return get_listen_streak_override(session, user_id)


listen_streak_endless_challenge_manager = ChallengeManager(
    "e", ChallengeListenEndlessStreakUpdater()
)


# Accessors
def get_listen_streak_challenges(
    session: Session, user_ids: List[int]
) -> List[ChallengeListenStreak]:
    return (
        session.query(ChallengeListenStreak)
        .filter(ChallengeListenStreak.user_id.in_(user_ids))
        .order_by(ChallengeListenStreak.last_listen_date.desc())
        .all()
    )


def get_most_recent_listen_streak_user_challenge(
    session: Session, user_ids: List[int]
) -> Optional[UserChallenge]:
    return (
        session.query(UserChallenge)
        .filter(UserChallenge.challenge_id == "e")
        .filter(UserChallenge.user_id.in_(user_ids))
        .order_by(UserChallenge.created_at.desc())
        .first()
    )
