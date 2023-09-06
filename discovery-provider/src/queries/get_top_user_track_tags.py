import logging  # pylint: disable=C0302

from sqlalchemy import desc, func

from src.models.tracks.tag_track_user_matview import t_tag_track_user
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


def get_top_user_track_tags(args):
    """
    Gets the most used tags for tracks owned by the query user

    Args:
        args: dict The parsed args from the request
        args.limit: number optional The max number of tags to return
        args.user_id: number The user id used to query for tracks

    Returns:
        Array of strings ordered by most used tag in track
    """
    db = get_db_read_replica()
    with db.scoped_session() as session:
        return _get_top_user_track_tags(session, args)


def _get_top_user_track_tags(session, args):
    most_used_tags = (
        session.query(t_tag_track_user.c.tag)
        .filter(t_tag_track_user.c.owner_id == args["user_id"])
        .group_by(t_tag_track_user.c.tag)
        .order_by(
            desc(func.count(t_tag_track_user.c.tag)), desc(t_tag_track_user.c.tag)
        )
        .all()
    )

    tags = [tag for tag, in most_used_tags]
    if "limit" in args:
        return tags[: args["limit"]]
    return tags
