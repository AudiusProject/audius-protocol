import logging
from typing import TypedDict

from src.api.v1.helpers import format_limit, format_offset
from src.queries.comments.utils import (
    COMMENT_ROOT_DEFAULT_LIMIT,
    _format_comment_response,
    build_comments_query,
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


def get_user_comments(args: GetUserCommentsArgs):
    """
    Get comments made by a specific user

    Args:
        args: Dictionary containing query parameters
            - user_id: ID of the user whose comments to retrieve
            - current_user_id: ID of the user making the request
            - sort_method: How to sort the comments (defaults to newest)
            - offset: Pagination offset
            - limit: Pagination limit

    Returns:
        List of comment objects with metadata
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

        # Format the results
        return [
            _format_comment_response(
                comment,
                react_count,
                is_muted,
                mentions,
                current_user_id,
                session,
                include_replies=False,  # User comments don't include nested replies
            )
            for comment, react_count, is_muted, mentions in user_comments
        ]
