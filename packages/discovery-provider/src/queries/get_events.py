from typing import List
from sqlalchemy import desc
from src.models.events.event import Event
from src.queries.query_helpers import add_query_pagination
from src.utils.db_session import get_db_read_replica


def get_events(args) -> List[Event]:
    """Get all events ordered by creation date descending.

    Returns:
        List[Event]: List of events
    """
    db = get_db_read_replica()
    limit, offset = args.get("limit"), args.get("offset")

    with db.scoped_session() as session:
        query = (
            session.query(Event)
            .order_by(desc(Event.created_at))
        )
        events = add_query_pagination(
            query, limit, offset, True, True
        ).all()

        return events 