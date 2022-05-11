from flask_restx import Namespace, Resource, fields
from src.api.v1.helpers import (
    extend_tip,
    make_full_response,
    make_response,
    pagination_with_current_user_parser,
    success_response,
)
from src.api.v1.models.users import user_model, user_model_full
from src.queries.get_tips import get_tips
from src.utils.helpers import decode_string_id
from src.utils.redis_cache import cache
from src.utils.redis_metrics import record_metrics

ns = Namespace("tips", description="Tip related operations")
full_ns = Namespace("tips", description="Full tip related operations")


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


tip_response = ns.model(
    "tip",
    {
        "amount": fields.String(required=True),
        "sender": fields.Nested(user_model),
        "receiver": fields.Nested(user_model),
        "created_at": fields.String(required=True),
    },
)

supporter_reference = full_ns.model(
    "supporter_reference", {"user_id": fields.String(required=True)}
)

full_tip_response = full_ns.clone(
    "full_tip",
    tip_response,
    {
        "sender": fields.Nested(user_model_full, required=True),
        "receiver": fields.Nested(user_model_full, required=True),
        "slot": fields.Integer(required=True),
        "followee_supporters": fields.List(
            fields.Nested(supporter_reference), required=True
        ),
        "transaction_signature": fields.String(required=True),
    },
)


get_tips_response = make_response(
    "get_tips_response", ns, fields.List(fields.Nested(tip_response))
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
            args["user_id"] = decode_string_id(args["user_id"])

        tips = get_tips(args)
        tips = list(map(extend_tip, tips))
        return success_response(tips)


full_get_tips_response = make_full_response(
    "get_tips_response", full_ns, fields.List(fields.Nested(full_tip_response))
)


full_tips_parser = tips_parser.copy()
full_tips_parser.add_argument(
    "min_slot",
    type=int,
    required=False,
    default=0,
    description="The minimum Solana slot to pull tips from",
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
            args["user_id"] = decode_string_id(args["user_id"])

        tips = get_tips(args)
        tips = list(map(extend_tip, tips))
        return success_response(tips)
