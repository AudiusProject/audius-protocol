from flask_restx import fields

from src.api.v1.models.common import ns
from src.models.events.event import EventEntityType, EventType

event_model = ns.model(
    "event",
    {
        "event_id": fields.String(required=True),
        "event_type": fields.String(required=True, enum=[e.value for e in EventType]),
        "user_id": fields.String(required=True),
        "entity_type": fields.String(
            required=False, enum=[e.value for e in EventEntityType]
        ),
        "entity_id": fields.String(required=False),
        "end_date": fields.String(required=False),
        "is_deleted": fields.Boolean(required=False),
        "created_at": fields.String(required=True),
        "updated_at": fields.String(required=True),
        "event_data": fields.Raw(required=True),
    },
)
