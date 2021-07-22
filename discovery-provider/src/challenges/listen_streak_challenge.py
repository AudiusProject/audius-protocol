from collections import Counter
from datetime import datetime
from src.challenges.challenge import ChallengeManager, ChallengeUpdater
from src.models import ListenStreakChallenge, Play
from src.challenges.challenge_event import ChallengeEvent

class ListenStreakChallengeUpdater(ChallengeUpdater):
    """7-day listening streak challenge"""

    def update_user_challenges(
        self, session, event, user_challenges_metadata, step_count, extras
    ):
        # Destruct the list of user challenges from the list of tuples of (user_challenge, event_metadata)
        user_challenges, _ = [list(t) for t in zip(*user_challenges_metadata)]
        user_ids = [user_challenge.user_id for user_challenge in user_challenges]
        partial_completions = get_listen_streak_challenges(session, user_ids)
        completion_map = {
            completion.user_id: completion for completion in partial_completions
        }

        if event == ChallengeEvent.track_listen:
            self._handle_track_listens(partial_completions, extras)

        # Update the user_challenges
        for user_challenge, event_metadata in user_challenges_metadata:
            matching_partial_challenge = completion_map[user_challenge.user_id]
            # Update step count
            user_challenge.current_step_count = matching_partial_challenge.listen_streak
            # Update completion
            user_challenge.is_complete = user_challenge.current_step_count == step_count
            if user_challenge.is_complete:
                user_challenge.completed_blocknumber = event_metadata["block_number"]

    def on_after_challenge_creation(self, session, user_ids):
        listen_streak_challenges = [
            ListenStreakChallenge(
                user_id=user_id,
                last_listen_date=False,
                listen_streak=0,
            )
            for user_id in user_ids
        ]
        session.add_all(listen_streak_challenges)

    # Helpers
    def _handle_track_listens(self, partial_completions, extras):
        # user_ids = list(map(lambda x: x.user_id, partial_completions))

        # TODO: Need to cover case where last_listen_date is null
        for idx, partial_completion in enumerate(partial_completions):
            last_timestamp = datetime.timestamp(partial_completion.last_listen_date)
            new_timestamp = datetime.timestamp(extras[idx].created_at)

            if (new_timestamp - last_timestamp >= (60 * 60 * 24)):
                partial_completion.last_listen_date = extras[idx].created_at
                # Check if the user missed a day or more
                if (new_timestamp - last_timestamp >= (60 * 60 * 48)):
                    partial_completion.listen_streak = 1
                else:
                    partial_completion.listen_streak += 1

listen_streak_challenge_manager = ChallengeManager(
    ChallengeEvent.track_listen, ListenStreakChallengeUpdater()
)

# Accessors
def get_listen_streak_challenges(session, user_ids):
    return (
        session.query(ListenStreakChallenge)
        .filter(ListenStreakChallenge.user_id.in_(user_ids))
        .all()
    )
