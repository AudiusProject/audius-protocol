from typing import List

from sqlalchemy import desc

from src.models.events.event import Event
from src.queries.query_helpers import add_query_pagination
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import encode_int_id


def format_events(events) -> List[Event]:
    """Format events for the API response."""
    formatted_events = []
    for event in events:
        formatted_events.append(
            {
                "event_id": encode_int_id(event.event_id),
                "entity_type": event.entity_type.value if event.entity_type else None,
                "user_id": encode_int_id(event.user_id),
                "entity_id": encode_int_id(event.entity_id)
                if event.entity_id
                else None,
                "event_type": event.event_type.value,
                "end_date": str(event.end_date),
                "is_deleted": event.is_deleted,
                "created_at": str(event.created_at),
                "updated_at": str(event.updated_at),
                "event_data": event.event_data,
            }
        )

    return formatted_events  # type: ignore


def get_events_by_id(args) -> List[Event]:
    """Get a list of events by their IDs.

    Returns:
        List[Event]: List of events corresponding to the provided IDs.
    """

    db = get_db_read_replica()
    ids = args.get("id")

    with db.scoped_session() as session:
        query = session.query(Event).filter(Event.event_id.in_(ids))
        events = query.all()

        return format_events(events)


def get_events(args) -> List[Event]:
    """Get all events ordered by creation date descending.

    Returns:
        List[Event]: List of events
    """

    db = get_db_read_replica()
    limit, offset = args.get("limit"), args.get("offset")

    with db.scoped_session() as session:
        query = session.query(Event).order_by(desc(Event.created_at))
        events = add_query_pagination(query, limit, offset).all()

        return format_events(events)
