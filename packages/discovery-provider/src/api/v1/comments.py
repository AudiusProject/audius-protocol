import logging

from flask_restx import Namespace, Resource, fields

from src.api.v1.helpers import (
    decode_with_abort,
    extend_related,
    make_full_response_with_related,
    make_response,
    pagination_with_current_user_parser,
    success_response,
)
from src.api.v1.models.comments import reply_comment_model
from src.queries.comments import get_paginated_replies
from src.queries.get_unclaimed_id import get_unclaimed_id
from src.utils.redis_cache import cache
from src.utils.redis_metrics import record_metrics

logger = logging.getLogger(__name__)

ns = Namespace("comments", description="Comment related operations")
full_ns = Namespace("comments", description="Full comment operations")

reply_response = make_response(
    "comment_response", ns, fields.Nested(reply_comment_model, as_list=True)
)


@ns.route("/<string:comment_id>/replies")
class CommentReplies(Resource):
    @record_metrics
    @ns.doc(
        id="""Get Comment Replies""",
        description="Gets replies to a parent comment",
        params={"comment_id": "A Comment ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(pagination_with_current_user_parser)
    @ns.marshal_with(reply_response)
    @cache(ttl_sec=5)
    def get(self, comment_id):
        args = pagination_with_current_user_parser.parse_args()
        decoded_id = decode_with_abort(comment_id, ns)
        current_user_id = args.get("user_id")
        comment_replies = get_paginated_replies(
            args, decoded_id, current_user_id, include_related=False
        )
        return success_response(comment_replies)


full_reply_response = make_full_response_with_related(
    "comment_response", full_ns, fields.Nested(reply_comment_model, as_list=True)
)


@full_ns.route("/<string:comment_id>/replies")
class FullCommentReplies(Resource):
    @record_metrics
    @full_ns.doc(
        id="""Get Comment Replies""",
        description="Gets replies to a parent comment",
        params={"comment_id": "A Comment ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(pagination_with_current_user_parser)
    @full_ns.marshal_with(full_reply_response)
    @cache(ttl_sec=5)
    def get(self, comment_id):
        args = pagination_with_current_user_parser.parse_args()
        decoded_id = decode_with_abort(comment_id, full_ns)
        current_user_id = args.get("user_id")
        comment_replies = get_paginated_replies(
            args, decoded_id, current_user_id, include_related=True
        )
        comment_replies["related"] = extend_related(
            comment_replies["related"], current_user_id
        )

        return success_response(comment_replies)


unclaimed_id_response = make_response("unclaimed_id_response", ns, fields.String())


@ns.route("/unclaimed_id")
class GetUnclaimedCommentId(Resource):
    @ns.doc(
        id="""Get unclaimed comment ID""",
        description="""Gets an unclaimed blockchain comment ID""",
        responses={200: "Success", 500: "Server error"},
    )
    @ns.marshal_with(unclaimed_id_response)
    def get(self):
        unclaimed_id = get_unclaimed_id("comment")
        return success_response(unclaimed_id)
