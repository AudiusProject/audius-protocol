from flask_restx import Namespace, Resource, inputs, fields, reqparse

from src.utils.redis_cache import cache
from src.utils.redis_metrics import record_metrics

from src.api.v1.helpers import (
    make_response,
    success_response,
)
from src.api.v1.models.comments import base_comment_model

ns = Namespace("comments", description="Comment related operations")

comment_response = make_response(
    "comment_response", ns, fields.Nested(base_comment_model)
)


@ns.route("/<string:id>")
class User(Resource):
    @record_metrics
    @ns.doc(
        id="""Get Comment""",
        description="Gets a single comment by its ID",
        params={"id": "A Comment ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.marshal_with(comment_response)
    @cache(ttl_sec=5)
    def get(self, id):
        mock_data = {
            "id": id,
            "message": "This is a special comment",
            "is_pinned": True,
            "timestamp_s": 123,
            "react_count": 1234,
            "created_at": "2021-01-01T00:00:00Z",
            "updated_at": None,
        }
        return success_response(mock_data)
