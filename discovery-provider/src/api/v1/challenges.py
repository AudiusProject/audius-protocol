import logging
from flask_restx import Resource, Namespace, fields, reqparse
from src.api.v1.models.common import favorite
from src.api.v1.models.challenges import undisbursed_challenge

from src.api.v1.helpers import (
    decode_with_abort,
    get_current_user_id,
    make_response,
    success_response,
    extend_challenge_response,
)


from src.utils.redis_cache import cache
from src.queries.get_undisbursed_challenges import get_undisbursed_challenges
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)

ns = Namespace("challenges", description="Challenge related operations")

get_undisbursed_challenges_route_parser = reqparse.RequestParser()
get_undisbursed_challenges_route_parser.add_argument("limit", required=False, type=int)
get_undisbursed_challenges_route_parser.add_argument(
    "completed_blocknumber", required=False, type=int
)
get_undisbursed_challenges_route_parser.add_argument(
    "user_id", required=False, type=str
)

get_challenges_response = make_response(
    "undisbursed_challenges", ns, fields.List(fields.Nested(undisbursed_challenge))
)


@ns.route("/undisbursed")
class GetUndisbursedChallenges(Resource):
    @ns.doc(
        params={
            "limit": "The maximum number of response challenges",
            "completed_blocknumber": "Starting blocknumber to retrieve completed undispursed challenges",
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
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
                    "completed_blocknumber": args["completed_blocknumber"],
                },
            )
            return success_response(undisbursed_challenges)
