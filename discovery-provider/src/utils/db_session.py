from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from flask import current_app
from src.queries.search_config import set_search_similarity

def on_init_db(db):
    """
    Queries to run on web server startup.
    """
    with db.scoped_session() as session:
        set_search_similarity(session)


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


class SessionManager:
    def __init__(self, db_url, db_engine_args):
        self._engine = create_engine(db_url, **db_engine_args)
        self._session_factory = sessionmaker(bind=self._engine)

    def session(self):
        """ Get a session for direct management/use. Use not recommended unless absolutely
            necessary.
        """
        return self._session_factory()

    @contextmanager
    def scoped_session(self, expire_on_commit=True):
        """ Usage:
                with scoped_session() as session:
                    use the session ...

            Session commits when leaving the block normally, or rolls back if an exception
            is thrown.

            Taken from: http://docs.sqlalchemy.org/en/latest/orm/session_basics.html
        """
        session = self._session_factory()
        session.expire_on_commit = expire_on_commit
        try:
            yield session
            session.commit()
        except:
            session.rollback()
            raise
        finally:
            session.close()
