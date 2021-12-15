UPDATE_INDEXING_CHECKPOINTS_QUERY = """
    INSERT INTO indexing_checkpoints (tablename, last_checkpoint)
    VALUES(:tablename, :last_checkpoint)
    ON CONFLICT (tablename)
    DO UPDATE SET last_checkpoint = EXCLUDED.last_checkpoint;
    """