import logging  # pylint: disable=C0302
from typing import List, Optional, TypedDict

from src.models.comments.comment import Comment
from src.queries.query_helpers import SortDirection, SortMethod
from src.utils import redis_connection
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import encode_int_id

logger = logging.getLogger(__name__)

redis = redis_connection.get_redis()


class RouteArgs(TypedDict):
    handle: str
    slug: str


class GetTrackArgs(TypedDict, total=False):
    user_id: int
    limit: int
    offset: int
    handle: str
    id: List[int]
    current_user_id: int
    authed_user_id: Optional[int]
    min_block_number: int

    # Deprecated, prefer sort_method and sort_direction
    sort: str

    query: Optional[str]
    filter_deleted: bool
    exclude_gated: bool
    routes: List[RouteArgs]
    filter_tracks: str

    # If true, skips the filtering of unlisted tracks
    skip_unlisted_filter: Optional[bool]

    # Optional sort method for the returned results
    sort_method: Optional[SortMethod]
    sort_direction: Optional[SortDirection]


def get_track_comments(track_id):
    track_comments = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        track_comments = (
            session.query(Comment)
            .filter(Comment.entity_id == track_id, Comment.entity_type == "Track")
            .all()
        )

        return [
            {
                "id": encode_int_id(track_comment.comment_id),
                "message": track_comment.text,
                "is_pinned": track_comment.is_pinned,
                "timestamp_s": track_comment.track_timestamp_ms,
                "react_count": 1,
                "replies": [],
                "created_at": str(track_comment.created_at),
                "updated_at": str(track_comment.updated_at),
            }
            for track_comment in track_comments
        ]
