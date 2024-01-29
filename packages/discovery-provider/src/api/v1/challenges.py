import logging
from datetime import datetime

from flask_restx import Namespace, Resource, abort, fields, reqparse

from src.api.v1.helpers import (
    DescriptiveArgument,
    decode_with_abort,
    error_response,
    extend_undisbursed_challenge,
    get_current_user_id,
    make_response,
    pagination_parser,
    success_response,
)
from src.api.v1.models.challenges import (
    attestation,
    challenge_info,
    create_sender_attestation,
    undisbursed_challenge,
)
from src.models.rewards.challenge import Challenge
from src.queries.get_attestation import (
    AttestationError,
    get_attestation,
    get_create_sender_attestation,
)
from src.queries.get_disbursed_challenges_amount import (
    get_disbursed_challenges_amount,
    get_weekly_pool_window_start,
)
from src.queries.get_undisbursed_challenges import get_undisbursed_challenges
from src.utils.db_session import get_db_read_replica
from src.utils.redis_cache import cache

logger = logging.getLogger(__name__)

ns = Namespace("challenges", description="Challenge related operations")
full_ns = Namespace("challenges", description="Challenge related operations")

attestation_response = make_response(
    "attestation_reponse", full_ns, fields.Nested(attestation)
)

attest_route = "/<string:challenge_id>/attest"

attest_parser = reqparse.RequestParser(argument_class=DescriptiveArgument)
attest_parser.add_argument(
    "oracle",
    required=True,
    description="The address of a valid, registered Anti-Abuse Oracle",
)
attest_parser.add_argument(
    "specifier",
    required=True,
    description="The specifier of the user challenge requiring the attestation",
)
attest_parser.add_argument(
    "user_id",
    required=True,
    description="The user ID of the user challenge requiring the attestation",
)


@full_ns.route(attest_route)
class FullAttest(Resource):
    @cache(ttl_sec=5)
    def _get(self, challenge_id: str):
        args = attest_parser.parse_args(strict=True)
        user_id: str = args["user_id"]
        oracle_address: str = args["oracle"]
        specifier: str = args["specifier"]
        decoded_user_id = decode_with_abort(user_id, full_ns)
        db = get_db_read_replica()
        with db.scoped_session() as session:
            try:
                owner_wallet, signature = get_attestation(
                    session,
                    user_id=decoded_user_id,
                    oracle_address=oracle_address,
                    specifier=specifier,
                    challenge_id=challenge_id,
                )

                return success_response(
                    {"owner_wallet": owner_wallet, "attestation": signature}
                )
            except AttestationError as e:
                abort(400, e)
                return None

    @full_ns.doc(
        id="Get Challenge Attestation",
        description="Produces an attestation that a given user has completed a challenge, or errors.",
        params={
            "challenge_id": "The challenge ID of the user challenge requiring the attestation"
        },
        responses={
            200: "Success",
            400: "The attestation request was invalid (eg. The user didn't complete that challenge yet)",
            500: "Server error",
        },
    )
    @full_ns.expect(attest_parser)
    @full_ns.marshal_with(attestation_response)
    def get(self, challenge_id: str):
        return self._get(challenge_id)


@ns.route(attest_route, doc=False)
class Attest(FullAttest):
    def get(self, challenge_id: str):
        return super()._get(challenge_id)


undisbursed_route = "/undisbursed"

get_undisbursed_challenges_route_parser = pagination_parser.copy()
get_undisbursed_challenges_route_parser.add_argument(
    "user_id",
    required=False,
    description="A User ID to filter the undisbursed challenges to a particular user",
)
get_undisbursed_challenges_route_parser.add_argument(
    "completed_blocknumber",
    required=False,
    type=int,
    description="Starting blocknumber to retrieve completed undisbursed challenges",
)

get_challenges_response = make_response(
    "undisbursed_challenges", ns, fields.List(fields.Nested(undisbursed_challenge))
)


@ns.route(undisbursed_route, doc=False)
class GetUndisbursedChallenges(Resource):
    @ns.doc(
        id="""Get Undisbursed Challenges""",
        description="""Get all undisbursed challenges""",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(get_undisbursed_challenges_route_parser)
    @ns.marshal_with(get_challenges_response)
    @cache(ttl_sec=5)
    def get(self):
        args = get_undisbursed_challenges_route_parser.parse_args()
        decoded_id = get_current_user_id(args)
        db = get_db_read_replica()

        with db.scoped_session() as session:
            undisbursed_challenges = get_undisbursed_challenges(
                session,
                {
                    "user_id": decoded_id,
                    "limit": args["limit"],
                    "offset": args["offset"],
                    "completed_blocknumber": args["completed_blocknumber"],
                },
            )
            undisbursed_challenges = list(
                map(extend_undisbursed_challenge, undisbursed_challenges)
            )
            return success_response(undisbursed_challenges)


create_sender_attest_route = "/attest_sender"

create_sender_attest_parser = reqparse.RequestParser(argument_class=DescriptiveArgument)
create_sender_attest_parser.add_argument(
    "sender_eth_address",
    required=True,
    description="The address of the discovery node to attest for",
)

create_sender_attestation_response = make_response(
    "attestation_response", ns, fields.Nested(create_sender_attestation)
)


@ns.route(create_sender_attest_route, doc=False)
class CreateSenderAttestation(Resource):
    @ns.doc(
        id="""Get Create Sender Attestation""",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(create_sender_attest_parser)
    @ns.marshal_with(create_sender_attestation_response)
    @cache(ttl_sec=5)
    def get(self):
        """
        Creates an attestation for a discovery node that it can attest for challenges.

        Produces an attestation that a specified discovery node is a validated, on-chain discovery node that can be used to sign challenges.
        """
        args = create_sender_attest_parser.parse_args(strict=True)
        sender_eth_address = args["sender_eth_address"]
        try:
            owner_wallet, attestation = get_create_sender_attestation(
                sender_eth_address
            )
            return success_response(
                {"owner_wallet": owner_wallet, "attestation": attestation}
            )
        except Exception as e:
            abort(400, e)
            return None


challenge_info_route = "/<string:challenge_id>/info"

challenge_info_parser = reqparse.RequestParser(argument_class=DescriptiveArgument)
challenge_info_parser.add_argument(
    "weekly_pool_min_amount",
    required=False,
    description="The minimum amount left in the weekly pool before erroring",
)

challenge_info_response = make_response(
    "challenge_info_response", ns, fields.Nested(challenge_info)
)


@ns.route(challenge_info_route, doc=False)
class ChallengeInfo(Resource):
    @ns.doc(
        id="""Get info for a challenge""",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(challenge_info_parser)
    @ns.marshal_with(challenge_info_response)
    @cache(ttl_sec=5)
    def get(self, challenge_id: str):
        """
        Gets challenge information, including remaining funds.
        """
        args = challenge_info_parser.parse_args(strict=True)
        weekly_pool_min_amount = args.get("weekly_pool_min_amount", None)
        weekly_pool_min_amount = (
            int(weekly_pool_min_amount) if weekly_pool_min_amount else None
        )
        try:
            db = get_db_read_replica()
            with db.scoped_session() as session:
                challenge = (
                    session.query(Challenge).filter(Challenge.id == challenge_id).one()
                )
                weekly_pool_remaining = get_disbursed_challenges_amount(
                    session, challenge_id, get_weekly_pool_window_start(datetime.now())
                )
                res = {
                    "challenge_id": challenge.id,
                    "type": challenge.type,
                    "amount": challenge.amount,
                    "active": challenge.active,
                    "step_count": challenge.step_count,
                    "starting_block": challenge.starting_block,
                    "weekly_pool": challenge.weekly_pool,
                    "weekly_pool_remaining": weekly_pool_remaining,
                    "cooldown_days": challenge.cooldown_days,
                }
                if (
                    weekly_pool_min_amount
                    and challenge.weekly_pool
                    and weekly_pool_remaining < weekly_pool_min_amount
                ):
                    return error_response(res)
                return success_response(res)
        except Exception as e:
            return abort(500, e)
