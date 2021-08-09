from sqlalchemy import desc
from src.models import Track, Stem, AggregateTrack
from src.queries.query_helpers import (
    populate_track_metadata,
    add_users_to_tracks,
    decayed_score,
)
from src.utils.db_session import get_db_read_replica
from src.utils import helpers


def get_remixable_tracks(args):
    """Gets a list of remixable tracks"""
    db = get_db_read_replica()
    limit = args.get("limit", 25)
    current_user_id = args.get("current_user_id", None)

    with db.scoped_session() as session:
        # Subquery to get current tracks that have stems
        remixable_tracks_subquery = (
            session.query(Track)
            .join(Stem, Stem.parent_track_id == Track.track_id)
            .filter(
                Track.is_current == True,
                Track.is_unlisted == False,
                Track.is_delete == False,
            )
            .distinct(Track.track_id)
            .subquery()
        )

        count_subquery = session.query(
            AggregateTrack.track_id.label("id"),
            (AggregateTrack.repost_count + AggregateTrack.save_count).label("count"),
        ).subquery()

        query = (
            session.query(
                Track,
                count_subquery.c["count"],
                decayed_score(count_subquery.c["count"], Track.created_at).label(
                    "score"
                ),
            )
            .select_entity_from(remixable_tracks_subquery)
            .join(
                count_subquery,
                count_subquery.c["id"] == Track.track_id,
            )
            .order_by(desc("score"), desc(Track.track_id))
            .limit(limit)
        )

        results = query.all()

        tracks = []
        for result in results:
            track = result[0]
            score = result[-1]
            track = helpers.model_to_dictionary(track)
            track["score"] = score
            tracks.append(track)

        track_ids = list(map(lambda track: track["track_id"], tracks))

        # Get user specific data for tracks
        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)

        if args.get("with_users", False):
            add_users_to_tracks(session, tracks, current_user_id)
        else:
            # Remove the user from the tracks
            tracks = [
                {key: val for key, val in dict.items() if key != "user"}
                for dict in tracks
            ]

    return tracks
