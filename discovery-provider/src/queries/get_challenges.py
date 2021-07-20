from functools import reduce
from collections import defaultdict
from typing import List, DefaultDict, Optional, TypedDict, Tuple, cast, Dict
from sqlalchemy import and_
from sqlalchemy.orm import Session

from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models import UserChallenge, Challenge, ChallengeType, ChallengeDisbursement


class ChallengeResponse(TypedDict):
    challenge_id: str
    user_id: int
    specifier: str
    is_complete: bool
    is_active: bool  # need this
    is_disbursed: bool  # need this
    current_step_count: Optional[int]
    max_steps: Optional[int]
    challenge_type: str
    metadata: Dict


def rollup_aggregates(
    user_challenges: List[UserChallenge], parent_challenge: Challenge
) -> ChallengeResponse:
    num_complete = reduce(
        lambda acc, cur: cast(int, acc) + 1 if cur.is_complete else acc,
        user_challenges,
        0,
    )

    # The parent challenge should have a step count, otherwise, we can just
    # say it's complete.
    if parent_challenge.step_count:
        is_complete = num_complete >= parent_challenge.step_count
    else:
        is_complete = True

    response_dict: ChallengeResponse = {
        "challenge_id": parent_challenge.id,
        "user_id": user_challenges[0].user_id,
        "specifier": "",
        "is_complete": is_complete,
        "current_step_count": num_complete,
        "max_steps": parent_challenge.step_count,
        "challenge_type": parent_challenge.type,
        "is_active": parent_challenge.active,
        "is_disbursed": False,  # This doesn't indicate anything for aggregate challenges
        "metadata": {},
    }
    return response_dict


def to_challenge_response(
    user_challenge: UserChallenge,
    challenge: Challenge,
    disbursement: ChallengeDisbursement,
    metadata: Dict,
) -> ChallengeResponse:
    return {
        "challenge_id": challenge.id,
        "user_id": user_challenge.user_id,
        "specifier": user_challenge.specifier,
        "is_complete": user_challenge.is_complete,
        "current_step_count": user_challenge.current_step_count,
        "max_steps": challenge.step_count,
        "challenge_type": challenge.type,
        "is_active": challenge.active,
        "is_disbursed": disbursement is not None,
        "metadata": metadata,
    }


def create_empty_user_challenges(
    user_id: int, challenges: List[Challenge], metadatas: List[Dict]
) -> List[ChallengeResponse]:
    user_challenges: List[ChallengeResponse] = []
    for i, challenge in enumerate(challenges):
        user_challenge: ChallengeResponse = {
            "challenge_id": challenge.id,
            "user_id": user_id,
            "specifier": "",
            "is_complete": False,
            "current_step_count": 0,
            "max_steps": challenge.step_count,
            "challenge_type": challenge.type,
            "is_active": challenge.active,
            "is_disbursed": False,
            "metadata": metadatas[i],
        }
        user_challenges.append(user_challenge)
    return user_challenges


def get_challenges_metadata(
    session: Session,
    event_bus: ChallengeEventBus,
    challenges: List[UserChallenge],
) -> List[Dict]:
    # Break it up into map per challenge type
    challenge_map: Dict[str, List[str]] = defaultdict(lambda: [])
    specifier_metadata_map: Dict[str, Dict] = {}
    for challenge in challenges:
        challenge_map[challenge.challenge_id].append(challenge.specifier)

    for challenge_type, specifiers in challenge_map.items():
        manager = event_bus.get_manager(challenge_type)
        metadatas = manager.get_metadata(session, specifiers)
        for i, specifier in enumerate(specifiers):
            metadata = metadatas[i]
            specifier_metadata_map[specifier] = metadata

    # Finally, re-sort the metadata
    return [specifier_metadata_map[c.specifier] for c in challenges]


def get_empty_metadata(event_bus: ChallengeEventBus, challenges: List[Challenge]):
    return [event_bus.get_manager(c.id).get_default_metadata() for c in challenges]


# gets challenges, returning:
# - any existing user_challenge, rolling up aggregate ones
# - for active, non-hidden challenges, returns default state
# - ignores inactive + completed, unless show_historical is true
def get_challenges(
    user_id: int,
    show_historical: bool,
    session: Session,
    event_bus: ChallengeEventBus,
) -> List[ChallengeResponse]:
    challenges_and_disbursements: List[Tuple[UserChallenge, ChallengeDisbursement]] = (
        session.query(UserChallenge, ChallengeDisbursement)
        # Need to do outerjoin because some challenges
        # may not have disbursements
        .outerjoin(
            ChallengeDisbursement,
            and_(
                ChallengeDisbursement.specifier == UserChallenge.specifier,
                ChallengeDisbursement.challenge_id == UserChallenge.challenge_id,
            ),
        ).filter(UserChallenge.user_id == user_id)
    ).all()

    # Combine aggregates

    all_challenges: List[Challenge] = (session.query(Challenge)).all()
    all_challenges_map = {challenge.id: challenge for challenge in all_challenges}

    # grab user challenges
    # if not historical, filter only to *active* challenges
    existing_user_challenges: List[UserChallenge] = [
        i[0]
        for i in challenges_and_disbursements
        if show_historical or all_challenges_map[i[0].challenge_id].active
    ]
    disbursements: List[ChallengeDisbursement] = [
        i[1] for i in challenges_and_disbursements
    ]

    regular_user_challenges: List[ChallengeResponse] = []
    aggregate_user_challenges_map: DefaultDict[str, List[UserChallenge]] = defaultdict(
        lambda: []
    )
    # Get extra metadata
    existing_metadata = get_challenges_metadata(
        session, event_bus, existing_user_challenges
    )
    for i, user_challenge in enumerate(existing_user_challenges):
        parent_challenge = all_challenges_map[user_challenge.challenge_id]
        if parent_challenge.type == ChallengeType.aggregate:
            # Filter out aggregate user_challenges that aren't complete.
            # this probably shouldn't even happen (what does it mean?)
            if user_challenge.is_complete:
                aggregate_user_challenges_map[user_challenge.challenge_id].append(
                    user_challenge
                )
        else:
            # If we're a trending challenge, don't add if the user_challenge is incomplete
            if (
                parent_challenge.type == ChallengeType.trending
                and not user_challenge.is_complete
            ):
                continue
            regular_user_challenges.append(
                to_challenge_response(
                    user_challenge,
                    parent_challenge,
                    disbursements[i],
                    existing_metadata[i],
                )
            )

    rolled_up: List[ChallengeResponse] = []
    for (challenge_id, challenges) in aggregate_user_challenges_map.items():
        parent_challenge = all_challenges_map[challenge_id]
        rolled_up.append(rollup_aggregates(challenges, parent_challenge))

    # Return empty user challenges for active challenges that are non-hidden
    active_non_hidden_challenges: List[Challenge] = [
        challenge
        for challenge in all_challenges
        if (challenge.active and not challenge.type == ChallengeType.trending)
    ]
    existing_challenge_ids = {
        user_challenge.challenge_id for user_challenge in existing_user_challenges
    }
    needs_user_challenge = [
        challenge
        for challenge in active_non_hidden_challenges
        if challenge.id not in existing_challenge_ids
    ]
    empty_metadata = get_empty_metadata(event_bus, needs_user_challenge)
    empty_challenges = create_empty_user_challenges(
        user_id, needs_user_challenge, empty_metadata
    )

    combined = regular_user_challenges + rolled_up + empty_challenges
    return combined
