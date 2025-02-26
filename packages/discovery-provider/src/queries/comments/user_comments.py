import logging
from typing import TypedDict

from src.api.v1.helpers import format_limit, format_offset
from src.queries.comments.utils import (
    COMMENT_ROOT_DEFAULT_LIMIT,
    build_comments_query,
    fetch_related_entities,
    format_comments,
    get_base_comments_query,
)
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


class GetUserCommentsArgs(TypedDict):
    sort_method: str
    offset: int
    limit: int
    user_id: int
    current_user_id: int


def get_user_comments(args: GetUserCommentsArgs, include_related=True):
    """
    Get comments made by a specific user

    Args:
        args: Dictionary containing query parameters
            - user_id: ID of the user whose comments to retrieve
            - current_user_id: ID of the user making the request
            - sort_method: How to sort the comments (defaults to newest)
            - offset: Pagination offset
            - limit: Pagination limit
        include_related: Whether to include related users and tracks in the response

    Returns:
        Dictionary with comments list and related users and tracks
    """
    offset, limit = format_offset(args), format_limit(
        args, default_limit=COMMENT_ROOT_DEFAULT_LIMIT
    )

    user_id = args["user_id"]
    current_user_id = args["current_user_id"]
    db = get_db_read_replica()

    with db.scoped_session() as session:
        # Get base query components
        base_query = get_base_comments_query(session, current_user_id)

        # Build the query using the shared utility function
        sort_method = args.get("sort_method", "newest")
        query = build_comments_query(
            session=session,
            query_type="user",
            base_query=base_query,
            current_user_id=current_user_id,
            user_id=user_id,
            sort_method=sort_method,
        )

        # Apply pagination
        query = query.offset(offset).limit(limit)

        # Execute the query
        user_comments = query.all()

        # Format comments and collect user/track IDs
        formatted_comments, user_ids, track_ids = format_comments(
            session=session,
            comments=user_comments,
            current_user_id=current_user_id,
            include_replies=False,
            artist_id=None,
        )

        # Prepare the response
        if include_related:
            # Fetch related entities
            related_users, related_tracks = fetch_related_entities(
                session, user_ids, track_ids, current_user_id
            )

            # Return the restructured response with related entities
            response = {
                "data": formatted_comments,
                "related": {
                    "users": related_users,
                    "tracks": related_tracks,
                },
            }
        else:
            # Return just the data without related entities
            response = {"data": formatted_comments}

        return response
