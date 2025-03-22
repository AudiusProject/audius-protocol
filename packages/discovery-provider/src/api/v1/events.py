from flask import Blueprint
from flask_restx import Namespace, Resource, fields

from src.api.v1.helpers import (
    format_limit,
    format_offset,
    make_response,
    pagination_with_current_user_parser,
    success_response,
)
from src.api.v1.models.events import event_model
from src.queries.get_events import get_events
from src.queries.get_unclaimed_id import get_unclaimed_id
from src.utils.redis_cache import cache

ns = Namespace("events", description="Events related operations")
bp = Blueprint("events", __name__)

events_parser = pagination_with_current_user_parser.copy()
events_parser.add_argument(
    "sort_method",
    required=False,
    default="newest",
    choices=("newest", "timestamp"),
    type=str,
    description="The sort method",
)

events_response = make_response("events_response", ns, fields.Nested(event_model))


@ns.route("/")
class EventList(Resource):
    @ns.doc(
        id="Get Events",
        description="Get all events",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(events_parser)
    @ns.marshal_with(events_response)
    @cache(ttl=5)
    def get(self):
        """Get all events"""
        request_args = events_parser.parse_args()
        args = {
            "limit": format_limit(request_args, default_limit=25),
            "offset": format_offset(request_args),
        }
        events = get_events(args)
        return make_response("events", ns, events)


unclaimed_id_response = make_response("unclaimed_id_response", ns, fields.String())


@ns.route("/unclaimed_id")
class GetUnclaimedEventId(Resource):
    @ns.doc(
        id="""Get unclaimed event ID""",
        description="""Gets an unclaimed blockchain event ID""",
        responses={200: "Success", 500: "Server error"},
    )
    @ns.marshal_with(unclaimed_id_response)
    def get(self):
        unclaimed_id = get_unclaimed_id("event")
        return success_response(unclaimed_id)
