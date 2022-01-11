from time import time
from src.models import IndexingCheckpoints

UPDATE_INDEXING_CHECKPOINTS_QUERY = """
    INSERT INTO indexing_checkpoints (tablename, last_checkpoint)
    VALUES(:tablename, :last_checkpoint)
    ON CONFLICT (tablename)
    DO UPDATE SET last_checkpoint = EXCLUDED.last_checkpoint;
    """


def get_elapsed_time_postgres(db, tablename):
    with db.scoped_session() as session:
        last_seen = last_checkpoint(session, tablename)
    elapsed_time_in_sec = (int(time()) - int(last_seen)) if last_seen else None
    return elapsed_time_in_sec


def last_checkpoint(session, tablename):
    last_seen = (
        session.query(IndexingCheckpoints.last_checkpoint).filter(
            IndexingCheckpoints.tablename == tablename
        )
    ).scalar()

    if last_seen:
        last_seen = int(last_seen)

    return last_seen
