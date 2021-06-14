from collections import Counter
from src.models import ProfileCompletionChallenge, Challenge, User, AggregateUser, Repost, UserChallenge, Follow, Save
from src.challenges.challenge_event_bus import ChallengeEvent
from src.challenges.challenge import ChallengeManager, ChallengeUpdater

REPOST_THRESHOLD = 1
FOLLOW_THRESHOLD = 5
FAVORITES_THRESHOLD = 1

class ProfileChallengeUpdater(ChallengeUpdater):
    def update_user_challenges(self, session, event, user_challenges, challenge):
        user_ids = [user_challenge.user_id for user_challenge in user_challenges]
        partial_completions = get_profile_completion_challenges(session, user_ids)
        completion_map = {completion.user_id: completion for completion in partial_completions}

        if event == ChallengeEvent.profile_update:
            users = get_users(session, user_ids)
            self._handle_profile_updates(completion_map, users)

        elif event == ChallengeEvent.repost:
            self._handle_reposts(session, partial_completions)

        elif event == ChallengeEvent.follow:
            self._handle_follow(session, partial_completions)

        elif event == ChallengeEvent.favorite:
            self._handle_favorite(session, partial_completions)

        # Update the user_challenges
        for user_challenge in user_challenges:
            matching_partial_challenge = completion_map[user_challenge.user_id]
            # Update step count
            user_challenge.current_step_count = self._get_steps_complete(matching_partial_challenge)
            # Update completion
            user_challenge.is_complete = user_challenge.current_step_count == challenge.step_count

    def on_after_challenge_creation(self, session, user_ids):
        profile_completion_challenges = [
            ProfileCompletionChallenge(
                user_id=user_id,
                profile_description=False,
                profile_name=False,
                profile_picture=False,
                profile_cover_photo=False,
                follows_complete=False,
                reposts_complete=False,
                favorites_complete=False
            ) for user_id in user_ids]
        session.add_all(profile_completion_challenges)

    # Helpers

    def _handle_profile_updates(self, completion_map, users):
        for user in users:
            completion = completion_map[user.user_id]
            completion.profile_description = user.bio is not None
            completion.profile_name = user.name is not None
            completion.profile_picture = user.profile_picture is not None or user.profile_picture_sizes is not None
            completion.profile_cover_photo = user.cover_photo is not None or user.cover_photo_sizes is not None

    def _handle_reposts(self, session, partial_completions):
        user_ids = list(map(lambda x: x.user_id, partial_completions))
        reposts = session.query(Repost).filter(
            Repost.is_current == True,
            Repost.user_id.in_(user_ids),
            Repost.is_delete == False
        ).all()
        reposts_counter = Counter(map(lambda x: x.user_id, reposts))

        for completion in partial_completions:
            completion.reposts_complete = reposts_counter[completion.user_id] >= REPOST_THRESHOLD

    def _handle_follow(self, session, partial_completions):
        user_ids = list(map(lambda x: x.user_id, partial_completions))
        follows = session.query(Follow).filter(
            Follow.is_current == True,
            Follow.follower_user_id.in_(user_ids),
            Follow.is_delete == False
        ).all()
        follows_counter = Counter(map(lambda x: x.follower_user_id, follows))
        for completion in partial_completions:
            completion.follows_complete = follows_counter[completion.user_id] >= FOLLOW_THRESHOLD

    def _handle_favorite(self, session, partial_completions):
        user_ids = list(map(lambda x: x.user_id, partial_completions))
        favorites = session.query(Save).filter(
            Save.is_current == True,
            Save.user_id.in_(user_ids),
            Save.is_delete == False
        ).all()
        follows_counter = Counter(map(lambda x: x.user_id, favorites))
        for completion in partial_completions:
            completion.favorites_complete = follows_counter[completion.user_id] >= FAVORITES_THRESHOLD

    def _get_steps_complete(self, partial_challenge):
        return (
            partial_challenge.profile_description +
            partial_challenge.profile_name + 
            partial_challenge.profile_picture +
            partial_challenge.profile_cover_photo +
            partial_challenge.follows_complete +
            partial_challenge.favorites_complete +
            partial_challenge.reposts_complete
        )

profile_challenge_manager = ChallengeManager('profile_completion', ProfileChallengeUpdater())

# Accessors
def get_profile_completion_challenges(session, user_ids):
    return session.query(ProfileCompletionChallenge).filter(ProfileCompletionChallenge.user_id.in_(user_ids)).all()

def get_users(session, user_ids):
    return session.query(User).filter(User.user_id.in_(user_ids)).all()

def get_aggregate_users(session, user_ids):
    return session.query(AggregateUser).filter(AggregateUser.user_id.in_(user_ids)).all()
