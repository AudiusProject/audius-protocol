from __future__ import with_statement

import os
import re

from alembic import context
from alembic.ddl.base import AddColumn, DropColumn, visit_add_column, visit_drop_column
from sqlalchemy import engine_from_config, pool
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.schema import CreateIndex, CreateTable, DropIndex, DropTable

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
from src.models.base import Base

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config


target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

kill_running_queries_sql = """
    BEGIN;
        SELECT
            pg_cancel_backend(pid),
            pid,
            state,
            age(clock_timestamp(), query_start),
            substring(trim(regexp_replace(query, '\s+', ' ', 'g')) from 1 for 200)
        FROM pg_stat_activity
        WHERE state != 'idle' AND query NOT ILIKE '%%pg_stat_activity%%'
        ORDER BY query_start DESC;
    COMMIT;
"""


def run_migrations_offline():
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")

    audius_db_url = os.getenv("audius_db_url")
    if audius_db_url:
        url = audius_db_url

    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    audius_db_url = os.getenv("audius_db_url")

    if audius_db_url:
        config.set_main_option("sqlalchemy.url", audius_db_url)

    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        connection.execute(kill_running_queries_sql)
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


@compiles(CreateIndex)
@compiles(CreateTable)
@compiles(AddColumn)
def _add_if_not_exists(element, compiler, **kw):
    """Adds support for IF NOT EXISTS to CREATE TABLE and CREATE INDEX commands"""
    # Inspired by https://github.com/AudiusProject/audius-protocol/pull/2997
    if isinstance(element, CreateIndex):
        output = compiler.visit_create_index(element, **kw)
    elif isinstance(element, CreateTable):
        output = compiler.visit_create_table(element, **kw)
    elif isinstance(element, AddColumn):
        output = visit_add_column(element, compiler, **kw)
    return re.sub(
        "(CREATE|ADD) (TABLE|INDEX|COLUMN)",
        r"\g<1> \g<2> IF NOT EXISTS",
        output,
        re.S,
    )


@compiles(DropIndex)
@compiles(DropTable)
@compiles(DropColumn)
def _add_if_exists(element, compiler, **kw):
    """Adds support for IF EXISTS to DROP TABLE and DROP INDEX commands"""
    # Inspired by https://github.com/AudiusProject/audius-protocol/pull/2997
    if isinstance(element, DropIndex):
        output = compiler.visit_drop_index(element, **kw)
    elif isinstance(element, DropTable):
        output = compiler.visit_drop_table(element, **kw)
    elif isinstance(element, DropColumn):
        output = visit_drop_column(element, compiler, **kw)
    return re.sub("DROP (TABLE|INDEX|COLUMN)", r"DROP \g<1> IF EXISTS", output, re.S)


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
