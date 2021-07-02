import json
import logging  # pylint: disable=C0302
import sqlalchemy

logger = logging.getLogger(__name__)


def get_database_liveness(**kwargs):
    """
    Gets database liveness with a `select 1` query

    Kwargs:
        db: global database instance
        redis: global redis instance
    """
    db = kwargs["db"]
    try:
        with db.scoped_session() as session:
            q = sqlalchemy.text("SELECT 1")
            session.execute(q).fetchone()
            return str(True)
    except Exception:
        return str(False)


def get_database_size(**kwargs):
    """
    Gets the size of the database in bytes

    Kwargs:
        db: global database instance
        redis: global redis instance
    """
    db = kwargs["db"]
    with db.scoped_session() as session:
        q = sqlalchemy.text("SELECT pg_database_size(current_database())")
        res = session.execute(q).fetchone()[0]
        return res


def get_database_connections(**kwargs):
    """
    Gets the number of active database connections

    Kwargs:
        db: global database instance
        redis: global redis instance
    """
    db = kwargs["db"]
    with db.scoped_session() as session:
        q = sqlalchemy.text(
            "SELECT numbackends from pg_stat_database where datname = current_database()"
        )
        res = session.execute(q).fetchone()[0]
        return res


def get_database_connection_info(**kwargs):
    """
    Gets full database query connection information (waits, state, query string)

    Kwargs:
        db: global database instance
        redis: global redis instance
    """
    db = kwargs["db"]
    with db.scoped_session() as session:
        q = sqlalchemy.text(
            f"select wait_event_type, wait_event, state, query, to_char(query_start, 'DD Mon YYYY HH:MI:SSPM')"
            + f'as "query_start" from pg_stat_activity where datname = current_database()'
        )
        result = session.execute(q).fetchall()
        connection_info = [dict(row) for row in result]
        return json.dumps(connection_info)


def get_database_index_count(**kwargs):
    """
    Gets number of indexes in the database

    Kwargs:
        db: global database instance
        redis: global redis instance
    """
    db = kwargs["db"]
    with db.scoped_session() as session:
        q = sqlalchemy.text(
            f"SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'"
        )
        res = session.execute(q).fetchone()[0]
        return res


def get_database_index_info(**kwargs):
    """
    Gets full database index information (tablename, indexname, indexdef)

    Kwargs:
        db: global database instance
        redis: global redis instance
    """
    db = kwargs["db"]
    with db.scoped_session() as session:
        q = sqlalchemy.text(
            f"SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public'"
            + f"ORDER BY tablename, indexname"
        )
        result = session.execute(q).fetchall()
        connection_info = [dict(row) for row in result]
        return json.dumps(connection_info)
