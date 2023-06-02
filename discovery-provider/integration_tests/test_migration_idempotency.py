import io
import os
import re
import subprocess
import sys

import alembic
import alembic.config
import sqlalchemy
from integration_tests.conftest import DB_URL
from sqlalchemy_utils import create_database, database_exists, drop_database
from src.utils.session_manager import SessionManager

# The starting migration to run the tests in this file from.
# Prior to this migration, lots of migrations are not idempotent.
# While they could be fixed, they would not reflect the state of
# production, so probably should not change. Migrations from this change
# on, should be replayable (or noted as an exception).
START_MIGRATION = "f775fb87f5ff"


def steal_stdout():
    # Lifted from https://github.com/sqlalchemy/alembic/blob/fe9fda175a68dca5e8cd285e96d7fbf8d271058e/tests/test_command.py#L42
    # try to simulate how sys.stdout looks - we send it u''
    # but then it's trying to encode to something.
    buf = io.BytesIO()
    wrapper = io.TextIOWrapper(buf, encoding="ascii", line_buffering=True)
    wrapper.getvalue = buf.getvalue
    return wrapper


def test_migration_idempotency():
    subprocess.run(
        ["./pg_migrate.sh", "test"],
        shell=True,
        cwd=os.getcwd() + "/ddl",
        env=os.environ,
        check=True,
    )

    return
    """
    Test the migrations are idempotent -- we can re-run them and they
    succeed. This is a useful test in making sure that during service upgrade
    a service provider may retry a migration multiple times.

    Because not all migrations are historically idempotent, this checking begins at
    the migration following START_MIGRATION
    """

    # Drop DB, ensuring migration performed at start
    if database_exists(DB_URL):
        drop_database(DB_URL)

    create_database(DB_URL)
    session_manager = SessionManager(DB_URL, {})

    # Run db migrations because the db gets dropped at the start of the tests
    alembic_dir = os.getcwd()
    alembic_config = alembic.config.Config(f"{alembic_dir}/alembic.ini")
    alembic_config.set_main_option("sqlalchemy.url", str(DB_URL))
    alembic_config.set_main_option("mode", "test")

    buf = steal_stdout()
    alembic_config.stdout = buf

    # Alembic commands print out instead of returning...
    alembic.command.history(alembic_config)
    # Rows of this output look like
    # b3084b7bc025 -> 5add54e23282, add stems support
    versions = buf.getvalue().decode("utf-8")

    def get_version(line):
        m = re.search(
            "(?P<old_version>.{12}) -> (?P<new_version>.{12}).*", line.strip()
        )
        if m:
            return m.group("new_version")
        return None

    versions = list(filter(None, map(get_version, versions.split("\n"))))
    # Ordered (chronological) list of all alembic revisions
    versions_in_chronological_order = list(reversed(versions))

    alembic_config.stdout = sys.stdout

    # Find migration to start at
    start_index = 0
    for i in range(len(versions_in_chronological_order)):
        if versions_in_chronological_order[i] == START_MIGRATION:
            start_index = i
            break

    # Apply migrations 1 by 1, each time resetting the stored alembic version
    # in the database and replaying the migration twice to test it's idempotency
    prev_version = START_MIGRATION
    for version in versions_in_chronological_order[start_index:]:
        print(f"Running migration {version}")
        alembic.command.upgrade(alembic_config, version)

        # Revert to prev_version
        with session_manager.scoped_session() as session:
            session.execute(
                sqlalchemy.text(
                    f"UPDATE alembic_version SET version_num = '{prev_version}' WHERE version_num = '{version}'"
                )
            )

        print(f"Running migration {version}")
        alembic.command.upgrade(alembic_config, version)

        prev_version = version

    drop_database(DB_URL)
