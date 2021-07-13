from typing import Optional
from collections import defaultdict

# TODO: remove this once we upgrade pylint
# pylint: disable=E0611
from typing import List, TypedDict
from sqlalchemy import and_, asc
from src.models import UserChallenge, Challenge, ChallengeType, ChallengeDisbursement


class ChallengeResponse(TypedDict):
    challenge_id: str
    user_id: int
    specifier: str
    amount: str
    completed_blocknumber: int


class AggregateUserChallenge(TypedDict):
    challenge_id: str
    user_id: int
    completed_blocknumber: int


def rollup_aggregates(
    user_challenge: AggregateUserChallenge, challenge: Challenge
) -> ChallengeResponse:
    response_dict: ChallengeResponse = {
        "challenge_id": challenge.id,
        "user_id": user_challenge["user_id"],
        "specifier": "",
        "amount": challenge.amount,
        "completed_blocknumber": user_challenge["completed_blocknumber"],
    }
    return response_dict


def to_challenge_response(
    user_challenge: UserChallenge, challenge: Challenge
) -> ChallengeResponse:
    return {
        "challenge_id": challenge.id,
        "user_id": user_challenge.user_id,
        "specifier": user_challenge.specifier,
        "amount": challenge.amount,
        "completed_blocknumber": user_challenge.completed_blocknumber,
    }


class UndisbursedChallengesArgs(TypedDict):
    user_id: Optional[int]
    limit: Optional[int]
    completed_blocknumber: Optional[int]


MAX_LIMIT = 500
DEFAULT_LIMIT = 100


# Questions - with the limit value - since we rollup should I just do a unique in query or do it after?
# Questions - For aggregate user challenges - will they be updated to all say completed after completion?

# gets undispbursed challenges, returning:
# - any existing user_challenge, rolling up aggregate ones
# - for active, non-hidden challenges, returns default state
# - ignores inactive + completed, unless show_historical is true
def get_undisbursed_challenges(
    session, args: UndisbursedChallengesArgs
) -> List[ChallengeResponse]:
    aggregate_undisbursed_challenges_query = (
        session.query(
            UserChallenge.challenge_id,
            UserChallenge.user_id,
            UserChallenge.completed_blocknumber,
        )
        # Need to do outerjoin because some challenges
        # may not have disbursements
        .outerjoin(
            ChallengeDisbursement,
            and_(
                ChallengeDisbursement.specifier == UserChallenge.specifier,
                ChallengeDisbursement.challenge_id == UserChallenge.challenge_id,
                ChallengeDisbursement.user_id == UserChallenge.user_id,
            ),
        )
        .outerjoin(
            Challenge,
            and_(Challenge.id == UserChallenge.challenge_id),
        )
        .group_by(
            UserChallenge.challenge_id,
            UserChallenge.user_id,
            UserChallenge.completed_blocknumber,
        )
        .filter(
            # Check that there is no matching challenge disburstment
            ChallengeDisbursement.challenge_id == None,
            UserChallenge.is_complete == True,
            Challenge.active == True,
            Challenge.type == ChallengeType.aggregate,
        )
        .order_by(
            asc(UserChallenge.completed_blocknumber),
            asc(UserChallenge.user_id),
            asc(UserChallenge.challenge_id),
        )
    )

    non_aggregate_undisbursed_challenges_query = (
        session.query(UserChallenge)
        # Need to do outerjoin because some challenges
        # may not have disbursements
        .outerjoin(
            ChallengeDisbursement,
            and_(
                ChallengeDisbursement.specifier == UserChallenge.specifier,
                ChallengeDisbursement.challenge_id == UserChallenge.challenge_id,
                ChallengeDisbursement.user_id == UserChallenge.user_id,
            ),
        )
        .outerjoin(
            Challenge,
            and_(Challenge.id == UserChallenge.challenge_id),
        )
        .filter(
            # Check that there is no matching challenge disburstment
            ChallengeDisbursement.challenge_id == None,
            UserChallenge.is_complete == True,
            Challenge.active == True,
            Challenge.type != ChallengeType.aggregate,
        )
        .order_by(
            asc(UserChallenge.completed_blocknumber),
            asc(UserChallenge.user_id),
            asc(UserChallenge.challenge_id),
        )
    )

    # Add Filters to the queries

    if args["user_id"] is not None:
        aggregate_undisbursed_challenges_query = (
            aggregate_undisbursed_challenges_query.filter(
                UserChallenge.user_id == args["user_id"]
            )
        )
        non_aggregate_undisbursed_challenges_query = (
            non_aggregate_undisbursed_challenges_query.filter(
                UserChallenge.user_id == args["user_id"]
            )
        )

    if args["completed_blocknumber"] is not None:
        aggregate_undisbursed_challenges_query = (
            aggregate_undisbursed_challenges_query.filter(
                UserChallenge.completed_blocknumber > args["completed_blocknumber"]
            )
        )
        non_aggregate_undisbursed_challenges_query = (
            non_aggregate_undisbursed_challenges_query.filter(
                UserChallenge.completed_blocknumber > args["completed_blocknumber"]
            )
        )

    limit = DEFAULT_LIMIT

    if args["completed_blocknumber"] is not None:
        limit = min(MAX_LIMIT, args["completed_blocknumber"])
    aggregate_undisbursed_challenges_query = (
        aggregate_undisbursed_challenges_query.limit(limit)
    )
    non_aggregate_undisbursed_challenges_query = (
        non_aggregate_undisbursed_challenges_query.limit(limit)
    )

    aggregate_challenges: List[AggregateUserChallenge] = [
        {
            "challenge_id": result[0],
            "user_id": result[1],
            "completed_blocknumber": result[2],
        }
        for result in aggregate_undisbursed_challenges_query.all()
    ]

    non_aggregate_challenges: List[
        UserChallenge
    ] = non_aggregate_undisbursed_challenges_query.all()

    # Combine aggregates
    all_challenges: List[Challenge] = (session.query(Challenge)).all()
    all_challenges_map = {challenge.id: challenge for challenge in all_challenges}

    non_aggregate_challenge_responses: List[ChallengeResponse] = [
        to_challenge_response(challenge, all_challenges_map[challenge.challenge_id])
        for challenge in non_aggregate_challenges
    ]

    aggregate_challenge_responses: List[ChallengeResponse] = [
        rollup_aggregates(challenge, all_challenges_map[challenge["challenge_id"]])
        for challenge in aggregate_challenges
    ]

    challenge_responses = (
        non_aggregate_challenge_responses + aggregate_challenge_responses
    )
    challenge_responses = sorted(
        challenge_responses,
        key=lambda challenge: (
            challenge["completed_blocknumber"],
            challenge["user_id"],
            challenge["challenge_id"],
        ),
    )

    return challenge_responses[:limit]
