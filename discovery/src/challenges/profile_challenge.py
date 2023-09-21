from collections import Counter
from typing import List, Optional

from sqlalchemy.orm.session import Session

from src.challenges.challenge import (
    ChallengeManager,
    ChallengeUpdater,
    FullEventMetadata,
)
from src.challenges.challenge_event import ChallengeEvent
from src.models.rewards.profile_completion_challenge import ChallengeProfileCompletion
from src.models.rewards.user_challenge import UserChallenge
from src.models.social.follow import Follow
from src.models.social.repost import Repost
from src.models.social.save import Save
from src.models.users.user import User

REPOST_THRESHOLD = 1
FOLLOW_THRESHOLD = 5
FAVORITES_THRESHOLD = 1


class ProfileChallengeUpdater(ChallengeUpdater):
    """Updates a profile completion challenge. Requires 7 steps to complete:
    - name (always exists)
    - description
    - cover photo
    - profile photo
    - follows > threshold
    - reposts > threshold
    - favorites > threshold
    """

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
        partial_completions = get_profile_completion_challenges(session, user_ids)
        completion_map = {
            completion.user_id: completion for completion in partial_completions
        }

        if event == ChallengeEvent.profile_update:
            users = get_user_dicts(session, user_ids)
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
            user_challenge.current_step_count = self._get_steps_complete(
                matching_partial_challenge
            )
            # Update completion
            user_challenge.is_complete = user_challenge.current_step_count == step_count

    def on_after_challenge_creation(self, session, metadatas: List[FullEventMetadata]):
        profile_completion_challenges = [
            ChallengeProfileCompletion(
                user_id=metadata["user_id"],
                profile_description=False,
                profile_name=False,
                profile_picture=False,
                profile_cover_photo=False,
                follows=False,
                reposts=False,
                favorites=False,
            )
            for metadata in metadatas
        ]
        session.add_all(profile_completion_challenges)

    # Helpers

    def _handle_profile_updates(self, completion_map, user_dicts):
        for user in user_dicts:
            completion = completion_map[user["user_id"]]
            completion.profile_description = user["bio"] is not None
            completion.profile_name = user["name"] is not None
            completion.profile_picture = (
                user["profile_picture"] is not None
                or user["profile_picture_sizes"] is not None
            )
            completion.profile_cover_photo = (
                user["cover_photo"] is not None or user["cover_photo_sizes"] is not None
            )

    def _handle_reposts(self, session, partial_completions):
        user_ids = list(map(lambda x: x.user_id, partial_completions))
        reposts = (
            session.query(Repost)
            .filter(
                Repost.is_current == True,
                Repost.user_id.in_(user_ids),
                Repost.is_delete == False,
            )
            .all()
        )
        reposts_counter = Counter(map(lambda x: x.user_id, reposts))

        for completion in partial_completions:
            completion.reposts = reposts_counter[completion.user_id] >= REPOST_THRESHOLD

    def _handle_follow(self, session, partial_completions):
        user_ids = list(map(lambda x: x.user_id, partial_completions))
        follows = (
            session.query(Follow)
            .filter(
                Follow.is_current == True,
                Follow.follower_user_id.in_(user_ids),
                Follow.is_delete == False,
            )
            .all()
        )
        follows_counter = Counter(map(lambda x: x.follower_user_id, follows))
        for completion in partial_completions:
            completion.follows = follows_counter[completion.user_id] >= FOLLOW_THRESHOLD

    def _handle_favorite(self, session, partial_completions):
        user_ids = list(map(lambda x: x.user_id, partial_completions))
        favorites = (
            session.query(Save)
            .filter(
                Save.is_current == True,
                Save.user_id.in_(user_ids),
                Save.is_delete == False,
            )
            .all()
        )
        follows_counter = Counter(map(lambda x: x.user_id, favorites))
        for completion in partial_completions:
            completion.favorites = (
                follows_counter[completion.user_id] >= FAVORITES_THRESHOLD
            )

    def _get_steps_complete(self, partial_challenge):
        return (
            partial_challenge.profile_description
            + partial_challenge.profile_name
            + partial_challenge.profile_picture
            + partial_challenge.profile_cover_photo
            + partial_challenge.follows
            + partial_challenge.favorites
            + partial_challenge.reposts
        )


profile_challenge_manager = ChallengeManager(
    "profile-completion", ProfileChallengeUpdater()
)


# Accessors
def get_profile_completion_challenges(session, user_ids):
    return (
        session.query(ChallengeProfileCompletion)
        .filter(ChallengeProfileCompletion.user_id.in_(user_ids))
        .all()
    )


def get_user_dicts(session, user_ids):
    res = (
        session.query(
            User.bio,
            User.name,
            User.profile_picture,
            User.profile_picture_sizes,
            User.cover_photo,
            User.cover_photo_sizes,
            User.user_id,
        ).filter(User.user_id.in_(user_ids), User.is_current == True)
    ).all()
    return [
        {
            "bio": attr[0],
            "name": attr[1],
            "profile_picture": attr[2],
            "profile_picture_sizes": attr[3],
            "cover_photo": attr[4],
            "cover_photo_sizes": attr[5],
            "user_id": attr[6],
        }
        for attr in res
    ]
