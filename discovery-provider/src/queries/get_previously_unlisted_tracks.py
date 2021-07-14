from src import exceptions
from src.models import Track
from src.utils.db_session import get_db_read_replica


def get_previously_unlisted_tracks(args):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        if "date" not in args:
            raise exceptions.ArgumentError(
                "'date' required to query for retrieving previously unlisted tracks"
            )

        date = args.get("date")

        tracks_after_date = (
            session.query(Track.track_id, Track.updated_at)
            .distinct(Track.track_id)
            .filter(Track.is_unlisted == False, Track.updated_at >= date)
            .subquery()
        )

        tracks_before_date = (
            session.query(Track.track_id, Track.updated_at)
            .distinct(Track.track_id)
            .filter(Track.is_unlisted == True, Track.updated_at < date)
            .subquery()
        )

        previously_unlisted_results = (
            session.query(tracks_before_date.c["track_id"])
            .join(
                tracks_after_date,
                tracks_after_date.c["track_id"] == tracks_before_date.c["track_id"],
            )
            .all()
        )

        track_ids = [result[0] for result in previously_unlisted_results]

    return {"ids": track_ids}
