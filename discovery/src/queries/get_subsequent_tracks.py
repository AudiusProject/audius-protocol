from sqlalchemy import asc

from src.models.tracks.track import Track
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import encode_int_id


def get_subsequent_tracks(track_id, limit):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        current_track = (
            session.query(Track)
            .filter(Track.is_current == True)
            .filter(Track.track_id == track_id)
            .first()
        )

        # tracks created after current track
        created_after_current = (
            session.query(
                Track.track_id.label("track_id"), Track.created_at.label("created_at")
            )
            .filter(Track.is_current == True)
            .filter(Track.created_at > current_track.created_at)
            # order must be deterministic
            .order_by(asc(Track.created_at), asc(Track.track_id))
            .limit(limit)
        )

        # tracks created in the same block but with a greater track ID
        # this way we can page through deterministically
        created_during_current = (
            session.query(
                Track.track_id.label("track_id"), Track.created_at.label("created_at")
            )
            .filter(Track.is_current == True)
            .filter(Track.created_at == current_track.created_at)
            .filter(Track.track_id > track_id)
            # order must be deterministic
            .order_by(asc(Track.track_id))
            .limit(limit)
        )

        subsequent_tracks = (
            created_after_current.union(created_during_current)
            .order_by(asc("created_at"), asc("track_id"))
            .all()
        )
        res = [
            encode_int_id(subsequent_track[0]) for subsequent_track in subsequent_tracks
        ]
        res = res[:limit]

        return res
