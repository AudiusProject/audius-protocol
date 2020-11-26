
import logging
import sqlalchemy

from sqlalchemy import desc
from src.models import Playlist, Track
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import create_save_repost_count_subquery

logger = logging.getLogger(__name__)

def get_playlists_containing_track(args):
    resp = []
    track_id = args.get('track_id')

    try:
        db = get_db_read_replica()
        with db.scoped_session() as session:
            count_subquery = create_save_repost_count_subquery(session, 'playlist')

            query = sqlalchemy.text(
                """
                select a.playlist_id from (
                    select playlist_id, playlist_contents->>'track_ids' track_ids, jsonb_array_elements(playlist_contents->'track_ids') track_id
                    from playlists
                    where
                    is_current = true and is_delete = false and is_private = false
                ) as a
                where
                    a.track_id @> '{"track": :track_id}'::jsonb
                """
            )
            playlists_containing_track = session.execute(
                query,
                { "track_id": track_id }
            ).fetchall()

            playlists_containing_track = [p[0] for p in playlists_containing_track]

            playlists = (
                session.query(Playlist)
                .join(
                    count_subquery,
                    count_subquery.c['id'] == Playlist.playlist_id
                )
                .filter(
                    Playlist.playlist_id.in_(playlists_containing_track),
                    Playlist.is_current == True,
                    Playlist.is_delete == False,
                    Playlist.is_private == False
                )
                .order_by(
                    desc(count_subquery.c['count']),
                    desc(Playlist.playlist_id)
                )
                .all()
            )

            resp = helpers.query_result_to_list(playlists)
    except Exception as e:
        logger.error(e)

    return resp
