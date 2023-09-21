from flask_restx import Namespace, Resource, fields

from src.api.v1.helpers import (
    abort_bad_request_param,
    decode_with_abort,
    extend_tip,
    make_full_response,
    make_response,
    pagination_with_current_user_parser,
    success_response,
)
from src.api.v1.models.tips import tip_model, tip_model_full
from src.queries.get_tips import get_tips
from src.utils.config import shared_config
from src.utils.redis_cache import cache
from src.utils.redis_metrics import record_metrics

ns = Namespace("tips", description="Tip related operations")
full_ns = Namespace("tips", description="Full tip related operations")


TIPS_EXCLUDED_RECIPIENTS: list[int] = []
env = shared_config["discprov"]["env"]
if env == "stage" or env == "dev":
    TIPS_EXCLUDED_RECIPIENTS = [12]
else:
    TIPS_EXCLUDED_RECIPIENTS = [51]  # Audius account


tips_parser = pagination_with_current_user_parser.copy()
tips_parser.add_argument(
    "receiver_min_followers",
    type=int,
    required=False,
    description="Only include tips to recipients that have this many followers",
    default=0,
)
tips_parser.add_argument(
    "receiver_is_verified",
    type=bool,
    required=False,
    description="Only include tips to recipients that are verified",
    default=False,
)
tips_parser.add_argument(
    "current_user_follows",
    type=str,
    required=False,
    description="Only include tips involving the user's followers in the given capacity. Requires user_id to be set.",
    default=None,
    choices=("sender", "receiver", "sender_or_receiver"),
)
tips_parser.add_argument(
    "unique_by",
    type=str,
    required=False,
    description="""Only include the most recent tip for a user was involved in the given capacity.

Eg. 'sender' will ensure that each tip returned has a unique sender, using the most recent tip sent by a user if that user has sent multiple tips.
    """,
    default=None,
    choices=("sender", "receiver"),
)


get_tips_response = make_response(
    "get_tips_response", ns, fields.List(fields.Nested(tip_model))
)


@ns.route("")
class Tips(Resource):
    @record_metrics
    @ns.doc(id="Get Tips", description="""Gets the most recent tips on the network""")
    @ns.expect(tips_parser)
    @ns.marshal_with(get_tips_response)
    @cache(ttl_sec=5)
    def get(self):
        args = tips_parser.parse_args()
        if args.get("user_id"):
            args["user_id"] = decode_with_abort(args["user_id"], full_ns)
        elif args.get("current_user_follows"):
            abort_bad_request_param(
                "current_user_follows. Missing user_id",
                full_ns,
            )
        args["exclude_recipients"] = TIPS_EXCLUDED_RECIPIENTS

        tips = get_tips(args)
        tips = list(map(extend_tip, tips))
        return success_response(tips)


full_get_tips_response = make_full_response(
    "get_tips_response", full_ns, fields.List(fields.Nested(tip_model_full))
)


full_tips_parser = tips_parser.copy()
full_tips_parser.add_argument(
    "min_slot",
    type=int,
    required=False,
    default=0,
    description="The minimum Solana slot to pull tips from",
)
full_tips_parser.add_argument(
    "max_slot",
    type=int,
    required=False,
    default=0,
    description="The maximum Solana slot to pull tips from",
)
full_tips_parser.add_argument(
    "tx_signatures",
    required=False,
    description="A list of transaction signatures of tips to fetch",
    action="split",
)


@full_ns.route("")
class FullTips(Resource):
    @record_metrics
    @full_ns.doc(
        id="Get Tips", description="""Gets the most recent tips on the network"""
    )
    @full_ns.expect(full_tips_parser)
    @full_ns.marshal_with(full_get_tips_response)
    @cache(ttl_sec=5)
    def get(self):
        args = full_tips_parser.parse_args()
        if args.get("user_id"):
            args["user_id"] = decode_with_abort(args["user_id"], full_ns)
        elif args.get("current_user_follows"):
            abort_bad_request_param(
                "current_user_follows. Missing user_id",
                full_ns,
            )
        args["exclude_recipients"] = TIPS_EXCLUDED_RECIPIENTS

        tips = get_tips(args)
        tips = list(map(extend_tip, tips))
        return success_response(tips)
