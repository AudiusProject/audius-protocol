import logging

from flask_restx import Namespace, Resource, fields

from src.api.v1.helpers import (
    decode_with_abort,
    make_response,
    pagination_parser,
    success_response,
)
from src.api.v1.models.comments import reply_comment_model
from src.queries.get_comments import get_comment_replies
from src.utils.redis_cache import cache
from src.utils.redis_metrics import record_metrics

logger = logging.getLogger(__name__)

ns = Namespace("comments", description="Comment related operations")

comment_response = make_response(
    "comment_response", ns, fields.Nested(reply_comment_model, as_list=True)
)


@ns.route("/<string:comment_id>/replies")
class CommentReplies(Resource):
    @record_metrics
    @ns.doc(
        id="""Get Comment""",
        description="Gets replies to a parent comment",
        params={"comment_id": "A Comment ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(pagination_parser)
    @ns.marshal_with(comment_response)
    @cache(ttl_sec=5)
    def get(self, comment_id):
        args = pagination_parser.parse_args()
        decoded_id = decode_with_abort(comment_id, ns)
        comment_replies = get_comment_replies(args, decoded_id)
        return success_response(comment_replies)
