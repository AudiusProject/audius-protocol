import ast
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from flask import current_app, g
from src.queries.search_config import set_search_similarity


session_manager = None


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
    if "db" not in g:
        g.db = SessionManager(
            current_app.config["db"]["url"],
            ast.literal_eval(current_app.config["db"]["engine_args_literal"]),
        )
        on_init_db(g.db)

    return g.db


def get_db_read_replica():
    """Connect to the configured database. The connection
    is unique for each request and will be reused if this is called
    again.
    """
    if "db_read_replica" not in g:
        g.db_read_replica = SessionManager(
            current_app.config["db"]["url_read_replica"],
            ast.literal_eval(current_app.config["db"]["engine_args_literal"]),
        )
        on_init_db(g.db_read_replica)

    return g.db_read_replica


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
