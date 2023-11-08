from typing import List, Optional, Tuple, TypedDict

from sqlalchemy import and_, asc

from src.models.rewards.challenge import Challenge
from src.models.rewards.challenge_disbursement import ChallengeDisbursement
from src.models.rewards.user_challenge import UserChallenge
from src.models.users.user import User


class UndisbursedChallengeResponse(TypedDict):
    challenge_id: str
    user_id: int
    specifier: str
    amount: str
    completed_blocknumber: Optional[int]
    handle: str
    wallet: str
    created_at: str
    cooldown_days: Optional[int]


def to_challenge_response(
    user_challenge: UserChallenge,
    challenge: Challenge,
    handle: str,
    wallet: str,
) -> UndisbursedChallengeResponse:
    return {
        "challenge_id": challenge.id,
        "user_id": user_challenge.user_id,
        "specifier": user_challenge.specifier,
        "amount": str(user_challenge.amount),
        "completed_blocknumber": user_challenge.completed_blocknumber,
        "handle": handle,
        "wallet": wallet,
        "created_at": str(user_challenge.created_at),
        "cooldown_days": challenge.cooldown_days,
    }


class UndisbursedChallengesArgs(TypedDict):
    user_id: Optional[int]
    limit: Optional[int]
    offset: Optional[int]
    completed_blocknumber: Optional[int]


MAX_LIMIT = 500
DEFAULT_LIMIT = 100


# Gets undisbursed challenges
# returning a list of challenge responses
def get_undisbursed_challenges(
    session, args: UndisbursedChallengesArgs
) -> List[UndisbursedChallengeResponse]:
    undisbursed_challenges_query = (
        session.query(UserChallenge, Challenge, User.handle, User.wallet)
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
            Challenge.id == UserChallenge.challenge_id,
        )
        .join(User, UserChallenge.user_id == User.user_id)
        .filter(
            # Check that there is no matching challenge disburstment
            ChallengeDisbursement.challenge_id == None,
            UserChallenge.is_complete == True,
            Challenge.active == True,
            User.is_current == True,
            User.is_deactivated == False,
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

    undisbursed_challenges: List[
        Tuple[UserChallenge, Challenge, str, str]
    ] = undisbursed_challenges_query.all()

    undisbursed_challenges_response: List[UndisbursedChallengeResponse] = [
        to_challenge_response(user_challenge, challenge, handle, wallet)
        for user_challenge, challenge, handle, wallet in undisbursed_challenges
    ]

    return undisbursed_challenges_response
