from src.models import Track, Stem
from src.utils import helpers
from src.utils.db_session import get_db_read_replica


def get_stems_of(track_id):
    db = get_db_read_replica()
    stems = []
    with db.scoped_session() as session:
        parent_not_deleted_subquery = (
            session.query(Track.is_delete).filter(Track.track_id == track_id).subquery()
        )

        stem_results = (
            session.query(Track)
            .join(
                Stem,
                Stem.child_track_id == Track.track_id,
            )
            .filter(Track.is_current == True, Track.is_delete == False)
            .filter(Stem.parent_track_id == track_id)
            .filter(parent_not_deleted_subquery.c.is_delete == False)
            .all()
        )
        stems = helpers.query_result_to_list(stem_results)

    return stems
