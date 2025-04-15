from flask_restx import Namespace, Resource, fields

from src.api.v1.helpers import (
    abort_not_found,
    current_user_parser,
    decode_ids_array,
    decode_with_abort,
    format_limit,
    format_offset,
    make_response,
    pagination_with_current_user_parser,
    success_response,
)
from src.api.v1.models.events import event_model
from src.models.events.event import EventEntityType, EventType
from src.queries.get_events import get_events, get_events_by_ids
from src.queries.get_unclaimed_id import get_unclaimed_id
from src.utils.redis_cache import cache

ns = Namespace("events", description="Events related operations")

events_response = make_response(
    "events_response", ns, fields.List(fields.Nested(event_model))
)

bulk_events_parser = current_user_parser.copy()
bulk_events_parser.add_argument(
    "id",
    required=False,
    action="append",
    description="The ID of the event(s) to retrieve",
)
bulk_events_parser.add_argument(
    "event_type",
    required=False,
    type=str,
    choices=list(EventType),
    description="The type of event to filter by",
)


@ns.route("")
class BulkEvents(Resource):
    @ns.doc(
        id="Get Bulk Events",
        description="Get a list of events by ID",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(bulk_events_parser)
    @ns.marshal_with(events_response)
    @cache(ttl=5)
    def get(self):
        args = bulk_events_parser.parse_args()
        ids = decode_ids_array(args.get("id") if args.get("id") else [])
        events = get_events_by_ids({"id": ids, "event_type": args.get("event_type")})
        if not events:
            abort_not_found(ids, ns)
        return success_response(events)


events_parser = pagination_with_current_user_parser.copy()
events_parser.add_argument(
    "sort_method",
    required=False,
    default="newest",
    choices=("newest", "timestamp"),
    type=str,
    description="The sort method",
)
events_parser.add_argument(
    "event_type",
    required=False,
    type=str,
    choices=list(EventType),
    description="The type of event to filter by",
)


@ns.route("/all")
class EventList(Resource):
    @ns.doc(
        id="Get All Events",
        description="Get all events",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(events_parser)
    @ns.marshal_with(events_response)
    @cache(ttl=5)
    def get(self):
        """Get all events"""
        args = events_parser.parse_args()
        events = get_events(
            {
                "limit": format_limit(args, default_limit=25),
                "offset": format_offset(args),
                "event_type": args.get("event_type"),
            }
        )
        return success_response(events)


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


entity_events_parser = pagination_with_current_user_parser.copy()
entity_events_parser.add_argument(
    "entity_id",
    required=True,
    type=str,
    description="The ID of the entity to get events for",
)
entity_events_parser.add_argument(
    "entity_type",
    required=False,
    type=str,
    choices=list(EventEntityType),
    description="The type of entity to get events for",
)
entity_events_parser.add_argument(
    "filter_deleted",
    required=False,
    type=bool,
    default=True,
    description="Whether to filter deleted events",
)


@ns.route("/entity")
class EntityEvents(Resource):
    @ns.doc(
        id="Get Entity Events",
        description="Get events for a specific entity",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(entity_events_parser)
    @ns.marshal_with(events_response)
    @cache(ttl=5)
    def get(self):
        """Get events for a specific entity"""
        args = entity_events_parser.parse_args()
        decoded_entity_id = decode_with_abort(args.get("entity_id"), ns)
        events = get_events(
            {
                "entity_id": decoded_entity_id,
                "entity_type": args.get("entity_type"),
                "filter_deleted": args.get("filter_deleted", True),
                "limit": format_limit(args),
                "offset": format_offset(args),
            }
        )
        return success_response(events)
