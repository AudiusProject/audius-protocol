from src.models import Play
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import (
    add_query_pagination,
)


def get_track_history(args):
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset")

    db = get_db_read_replica()
    with db.scoped_session() as session:
        base_query = (
            session.query(Play.play_item_id, Play.created_at)
            .filter(Play.user_id == current_user_id)
            .order_by(Play.created_at.desc())
        )

        query_results = add_query_pagination(base_query, limit, offset).all()

        if not query_results:
            return []

        track_history = []
        for query_result in query_results:
            track_history.append(
                {"track_id": query_result[0], "created_at": query_result[1]}
            )

        return track_history
