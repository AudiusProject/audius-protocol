from typing import List, TypedDict, Optional
from sqlalchemy import and_, asc
from src.models import UserChallenge, Challenge, ChallengeDisbursement


class ChallengeResponse(TypedDict):
    challenge_id: str
    user_id: int
    specifier: str
    amount: str
    completed_blocknumber: int


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
    offset: Optional[int]
    completed_blocknumber: Optional[int]


MAX_LIMIT = 500
DEFAULT_LIMIT = 100


# Gets undispbursed challenges
# returning a list of challenge responses
def get_undisbursed_challenges(
    session, args: UndisbursedChallengesArgs
) -> List[ChallengeResponse]:
    undisbursed_challenges_query = (
        session.query(UserChallenge)
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
        )
        .order_by(
            asc(UserChallenge.completed_blocknumber),
            asc(UserChallenge.user_id),
            asc(UserChallenge.challenge_id),
        )
    )

    # Add Filters to the queries

    if args["user_id"] is not None:
        undisbursed_challenges_query = undisbursed_challenges_query.filter(
            UserChallenge.user_id == args["user_id"]
        )

    if args["completed_blocknumber"] is not None:
        undisbursed_challenges_query = undisbursed_challenges_query.filter(
            UserChallenge.completed_blocknumber > args["completed_blocknumber"]
        )

    limit = DEFAULT_LIMIT

    if args["limit"] is not None:
        limit = min(MAX_LIMIT, args["limit"])
    undisbursed_challenges_query = undisbursed_challenges_query.limit(limit)

    if args["offset"] is not None:
        undisbursed_challenges_query = undisbursed_challenges_query.offset(
            args["offset"]
        )

    undisbursed_challenges: List[UserChallenge] = undisbursed_challenges_query.all()

    all_challenges: List[Challenge] = (session.query(Challenge)).all()
    all_challenges_map = {challenge.id: challenge for challenge in all_challenges}

    undisbursed_challenges_response: List[ChallengeResponse] = [
        to_challenge_response(challenge, all_challenges_map[challenge.challenge_id])
        for challenge in undisbursed_challenges
    ]

    return undisbursed_challenges_response
