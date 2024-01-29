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
            "select wait_event_type, wait_event, state, query, to_char(query_start, 'DD Mon YYYY HH:MI:SSPM')"
            + 'as "query_start" from pg_stat_activity where datname = current_database()'
        )

        result = session.execute(q).fetchall()
        connection_info = []
        for row in result:
            formatted = dict(row)
            if "query" in formatted:
                formatted["query"] = formatted["query"][:1000]
            connection_info.append(formatted)
        return json.dumps(connection_info)


def get_table_size_info(**kwargs):
    """
    Gets table information (number of rows, data size).

    Kwargs:
        db: global database instance
        redis: global redis instance
    """
    db = kwargs["db"]
    with db.scoped_session() as session:
        sql_statement = """SELECT c.relname AS table_name,
                c.reltuples::text AS rows,
                pg_size_pretty(pg_relation_size(s.relid)) AS data_size,
                pg_size_pretty(pg_indexes_size(s.relid)) AS indexes_size,
                pg_size_pretty(pg_total_relation_size(s.relid)) as full_size
            FROM pg_class c
            JOIN pg_catalog.pg_statio_user_tables s ON s.relname = c.relname
            WHERE c.relkind = 'r'
            ORDER BY pg_relation_size(s.relid) DESC;"""

        q = sqlalchemy.text(sql_statement)
        result = session.execute(q).fetchall()
        table_size_info = [dict(row) for row in result]
        return json.dumps(table_size_info)


# add pg_stat_statements to shared_preload_libraries in the db docker container
# at /var/lib/postgresql/data/postgresql.conf
# docker restart discovery db container and confirm config was applied
# select * from pg_file_settings
def get_frequent_queries(**kwargs):
    """
    Gets the most frequent queries

    Kwargs:
        db: global database instance
        redis: global redis instance
    """
    db = kwargs["db"]
    with db.scoped_session() as session:
        q = sqlalchemy.text(
            "SELECT query, calls FROM pg_stat_statements ORDER BY calls DESC LIMIT 100"
        )
        result = session.execute(q).fetchall()
        frequent_queries = [dict(row) for row in result]
        return json.dumps(frequent_queries)


def get_slow_queries(**kwargs):
    """
    Gets the queries with the highest average latency

    Kwargs:
        db: global database instance
        redis: global redis instance
    """
    db = kwargs["db"]

    version_query = sqlalchemy.text("SHOW server_version_num;")
    with db.scoped_session() as session:
        version = session.execute(version_query).scalar()
        version = int(version)

        if version >= 130000:  # postgres 13 or later
            query_text = """
            SELECT query, mean_plan_time, mean_exec_time, (mean_plan_time + mean_exec_time) AS total_mean_time
            FROM pg_stat_statements 
            ORDER BY total_mean_time DESC 
            LIMIT 100
            """
        else:
            query_text = "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 100"

        q = sqlalchemy.text(query_text)
        result = session.execute(q).fetchall()
        slow_queries = [dict(row) for row in result]

    return json.dumps(slow_queries)
