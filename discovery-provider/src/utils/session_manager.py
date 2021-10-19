from contextlib import contextmanager
import inspect
import logging  # pylint: disable=C0302
from sqlalchemy import create_engine
from sqlalchemy.event import listen
from sqlalchemy.orm import sessionmaker
from src.queries.search_config import set_search_similarity

logger = logging.getLogger(__name__)


class SessionManager:
    def __init__(self, db_url, db_engine_args):
        self._engine = create_engine(db_url, **db_engine_args)

        self._session_factory = sessionmaker(bind=self._engine)

        # Attach listeners for new engine connection.
        # See https://docs.sqlalchemy.org/en/14/core/event.html
        listen(self._engine, "connect", self.on_connect)
        listen(
            self._engine, "before_cursor_execute", self.comment_sql_calls, retval=True
        )  # retval=True allows us to append a comment to the statement ad-hoc

        # Attach listeners for sessions.
        # See https://docs.sqlalchemy.org/en/14/orm/events.html
        listen(self._session_factory, "after_begin", self.session_on_after_begin)

    def comment_sql_calls(
        self, conn, cursor, statement, parameters, context, executemany
    ):
        """
        Before the engine tries to execute a statement,
        try to comment the caller's function name.
        """
        if "src" in conn.info:
            statement = "-- %s \n" % conn.info.pop("src") + statement

        return statement, parameters

    def session_on_after_begin(self, session, transaction, connection):
        """
        After a transaction has begun, try to add the caller's function
        name to the connection.

        This serves as a bridge between the ORM session object and the connection
        which will be used for statements.
        """
        if "src" in session.info:
            connection.info["src"] = session.info["src"]

    def on_connect(self, dbapi_conn, connection_record):
        """
        Callback invoked with a raw DBAPI connection every time the engine assigns a new
        connection to the session manager.

        Actions that should be fired on new connection should be performed here.
        For example, pg_trgm.similarity_threshold needs to be set once for each connection,
        but not if that connection is recycled and used in another session.
        """
        logger.debug("Using new DBAPI connection")
        cursor = dbapi_conn.cursor()
        set_search_similarity(cursor)
        cursor.close()

    @contextmanager
    def session(self):
        """
        Get a session for direct management/use. Use not recommended unless absolutely
        necessary.
        """
        return self._session_factory()

    @contextmanager
    def scoped_session(self, expire_on_commit=True):
        """
        Usage:
            with scoped_session() as session:
                use the session ...

        Session commits when leaving the block normally, or rolls back if an exception
        is thrown.

        Taken from: http://docs.sqlalchemy.org/en/latest/orm/session_basics.html
        """
        session = self._session_factory()
        session.expire_on_commit = expire_on_commit

        try:
            session.info["src"] = inspect.stack()[2][3]  # get caller's function name
        except Exception:
            pass

        try:
            yield session
            session.commit()
        except:
            session.rollback()
            raise
        finally:
            session.close()
