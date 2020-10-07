from sqlalchemy import desc, and_

from src.models import Track, Remix
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import populate_track_metadata, \
    add_query_pagination, add_users_to_tracks


def get_remix_track_parents(args):
    track_id = args.get("track_id")
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset")
    db = get_db_read_replica()
    with db.scoped_session() as session:
        base_query = (
            session.query(Track)
            .join(
                Remix,
                and_(
                    Remix.parent_track_id == Track.track_id,
                    Remix.child_track_id == track_id
                )
            )
            .filter(
                Track.is_current == True,
                Track.is_unlisted == False
            )
            .order_by(
                desc(Track.created_at),
                desc(Track.track_id)
            )
        )

        tracks = add_query_pagination(base_query, limit, offset).all()
        tracks = helpers.query_result_to_list(tracks)
        track_ids = list(map(lambda track: track["track_id"], tracks))
        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)

        if args.get("with_users", False):
            add_users_to_tracks(session, tracks)

    return tracks
