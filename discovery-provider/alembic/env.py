from __future__ import with_statement

import os
import re

from alembic import context
from sqlalchemy import engine_from_config, pool
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.schema import CreateIndex, CreateTable, DropIndex, DropTable
from sqlalchemy.sql import ddl

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
from src.models import Base

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config


target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


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
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


@compiles(CreateIndex)
@compiles(CreateTable)
def _add_if_not_exists(element, compiler, **kw):
    """Adds support for IF NOT EXISTS to CREATE TABLE and CREATE INDEX commands"""
    # Inspired by https://github.com/AudiusProject/audius-protocol/pull/2997
    if isinstance(element, ddl.CreateIndex):
        output = compiler.visit_create_index(element, **kw)
    elif isinstance(element, ddl.CreateTable):
        output = compiler.visit_create_table(element, **kw)
    if element.element.info.get("if_not_exists"):
        output = re.sub(
            "CREATE (TABLE|INDEX)", r"CREATE \g<1> IF NOT EXISTS", output, re.S
        )
    return output


@compiles(DropIndex)
@compiles(DropTable)
def _add_if_exists(element, compiler, **kw):
    """Adds support for IF EXISTS to DROP TABLE and DROP INDEX commands"""
    # Inspired by https://github.com/AudiusProject/audius-protocol/pull/2997
    if isinstance(element, ddl.DropIndex):
        output = compiler.visit_drop_index(element, **kw)
    elif isinstance(element, ddl.DropTable):
        output = compiler.visit_drop_table(element, **kw)
    if element.element.info.get("if_exists"):
        output = re.sub("DROP (TABLE|INDEX)", r"DROP \g<1> IF EXISTS", output, re.S)
    return output


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
