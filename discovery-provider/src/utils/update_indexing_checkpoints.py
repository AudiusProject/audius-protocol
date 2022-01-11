from src.models import IndexingCheckpoints

UPDATE_INDEXING_CHECKPOINTS_QUERY = """
    INSERT INTO indexing_checkpoints (tablename, last_checkpoint)
    VALUES(:tablename, :last_checkpoint)
    ON CONFLICT (tablename)
    DO UPDATE SET last_checkpoint = EXCLUDED.last_checkpoint;
    """


def get_latest_blocknumber_postgres(session: Session, tablename: str) -> Optional[int]:
    # get latest db state from postgres cache
    latest_indexed_block_num = last_checkpoint(session, tablename)
    if latest_indexed_block_num is not None:
        return int(latest_indexed_block_num)
    db_block_query = (
        session.query(Block.number).filter(Block.is_current == True).first()
    )
    if db_block_query is None:
        return None
    return db_block_query[0]


def last_checkpoint(session, tablename):
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
