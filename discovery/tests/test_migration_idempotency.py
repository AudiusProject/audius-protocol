import os
import subprocess

from sqlalchemy_utils import create_database, database_exists, drop_database

from tests.conftest import DB_URL


def test_migration_idempotency():
    if database_exists(DB_URL):
        drop_database(DB_URL)

    create_database(DB_URL)
    subprocess.run(
        ["./pg_migrate.sh", "test"],
        shell=True,
        cwd=os.getcwd() + "/ddl",
        env=os.environ,
        check=True,
    )

    return
