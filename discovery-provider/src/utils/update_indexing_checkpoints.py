from sqlalchemy import text
from src.models.indexing.indexing_checkpoints import IndexingCheckpoints

UPDATE_INDEXING_CHECKPOINTS_QUERY = """
    INSERT INTO indexing_checkpoints (tablename, last_checkpoint)
    VALUES(:tablename, :last_checkpoint)
    ON CONFLICT (tablename)
    DO UPDATE SET last_checkpoint = EXCLUDED.last_checkpoint;
    """


def save_indexed_checkpoint(session, tablename, checkpoint):
    session.execute(
        text(UPDATE_INDEXING_CHECKPOINTS_QUERY),
        {
            "tablename": tablename,
            "last_checkpoint": checkpoint,
        },
    )


def get_last_indexed_checkpoint(session, tablename):
    last_seen = (
        session.query(IndexingCheckpoints.last_checkpoint).filter(
            IndexingCheckpoints.tablename == tablename
        )
    ).scalar()

    if last_seen:
        last_seen = int(last_seen)
    else:
        last_seen = 0

    return last_seen
