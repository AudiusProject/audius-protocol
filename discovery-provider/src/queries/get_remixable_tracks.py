from sqlalchemy import desc
from src.models import Track, Stem
from src.queries.query_helpers import create_save_repost_count_subquery, \
    get_current_user_id, populate_track_metadata, add_users_to_tracks, decayed_score
from src.utils.db_session import get_db_read_replica
from src.utils import helpers

def get_remixable_tracks(args):
    """Gets a list of remixable tracks"""
    current_user_id = get_current_user_id()
    db = get_db_read_replica()
    limit = args.get('limit', 25)

    with db.scoped_session() as session:
        # Subquery to get current tracks that have stems
        remixable_tracks_subquery = (
            session.query(Track)
                .join(Stem, Stem.parent_track_id == Track.track_id)
                .filter(
                    Track.is_current == True,
                    Track.is_unlisted == False,
                    Track.is_delete == False
                )
                .subquery()
        )

        count_subquery = create_save_repost_count_subquery(session, 'track')

        query = (
            session.query(
                remixable_tracks_subquery,
                count_subquery.c['count'],
                decayed_score(
                    count_subquery.c['count'],
                    remixable_tracks_subquery.c.created_at
                ).label('score')
            )
            .select_from(remixable_tracks_subquery)
            .join(
                count_subquery,
                count_subquery.c['id'] == remixable_tracks_subquery.c.track_id
            )
            .order_by(
                desc('score'),
                desc(remixable_tracks_subquery.c.track_id)
            )
            .limit(limit)
        )

        remixable_result = query.all()

        tracks = helpers.query_result_to_list(remixable_result)
        track_ids = list(map(lambda track: track['track_id'], tracks))

        # Get user specific data for tracks
        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)

        if args.get('with_users', False):
            add_users_to_tracks(session, tracks, current_user_id)

    return tracks