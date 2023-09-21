from flask import current_app


def get_db():
    """Connect to the configured database. The connection
    is unique for each request and will be reused if this is called
    again.
    """
    return current_app.db_session_manager


def get_db_read_replica():
    """Connect to the configured database. The connection
    is unique for each request and will be reused if this is called
    again.
    """
    return current_app.db_read_replica_session_manager
