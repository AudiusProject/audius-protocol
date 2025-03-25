from flask_restx import fields

from src.api.v1.models.common import ns
from src.models.events.event import EventEntityType, EventType

event_model = ns.model(
    "event",
    {
        "event_id": fields.Integer(required=True),
        "event_type": fields.String(required=True, enum=[e.value for e in EventType]),
        "user_id": fields.Integer(required=True),
        "entity_type": fields.String(
            required=False, enum=[e.value for e in EventEntityType]
        ),
        "entity_id": fields.Integer(required=False),
        "end_date": fields.DateTime(required=False),
        "is_deleted": fields.Integer(required=False),
        "created_at": fields.DateTime(required=True),
        "updated_at": fields.DateTime(required=True),
        "event_data": fields.Raw(required=True),
    },
)
