from sqlalchemy import desc
from sqlalchemy.orm import aliased

from src.models.tracks.aggregate_track import AggregateTrack
from src.models.tracks.stem import Stem
from src.models.tracks.track import Track
from src.queries.query_helpers import (
    add_users_to_tracks,
    decayed_score,
    populate_track_metadata,
)
from src.utils import helpers
from src.utils.db_session import get_db_read_replica


def get_remixable_tracks(args):
    """Gets a list of remixable tracks"""
    db = get_db_read_replica()
    limit = args.get("limit", 25)
    current_user_id = args.get("current_user_id", None)

    StemTrack = aliased(Track)

    with db.scoped_session() as session:
        # Subquery to get current tracks that have stems
        remixable_tracks_subquery = (
            session.query(Track)
            .join(Stem, Stem.parent_track_id == Track.track_id)
            .join(StemTrack, Stem.child_track_id == StemTrack.track_id)
            .filter(
                Track.is_current == True,
                Track.is_unlisted == False,
                Track.is_delete == False,
                Track.stream_conditions.is_(None),
                StemTrack.is_current == True,
                StemTrack.is_unlisted == False,
                StemTrack.is_delete == False,
            )
            .distinct(Track.track_id)
            .subquery()
        )
        track_alias = aliased(Track, remixable_tracks_subquery)

        count_subquery = session.query(
            AggregateTrack.track_id.label("id"),
            (AggregateTrack.repost_count + AggregateTrack.save_count).label("count"),
        ).subquery()

        query = (
            session.query(
                track_alias,
                count_subquery.c["count"],
                decayed_score(count_subquery.c["count"], track_alias.created_at).label(
                    "score"
                ),
            )
            .join(
                count_subquery,
                count_subquery.c["id"] == track_alias.track_id,
            )
            .order_by(desc("score"), desc(track_alias.track_id))
            .limit(limit)
        )

        results = query.all()

        tracks = []
        for result in results:
            track = result[0]
            # Convert decimal to float for serialization
            score = float(result[-1])
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
