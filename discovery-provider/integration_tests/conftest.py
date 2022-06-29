from __future__ import absolute_import

import os
from contextlib import contextmanager

import alembic
import alembic.config
import pytest
import src
from pytest_postgresql import factories
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy_utils import create_database, database_exists, drop_database
from src.app import create_app, create_celery
from src.models.base import Base
from src.utils import helpers
from src.utils.redis_connection import get_redis
from web3 import HTTPProvider, Web3

DB_URL = "postgresql+psycopg2://postgres:postgres@localhost:5432/test_audius_discovery"
TEST_BROKER_URL = "redis://localhost:5379/0"
ENGINE_ARGS_LITERAL = '{ \
    "pool_size": 10, \
    "max_overflow": 0, \
    "pool_recycle": 3600, \
    "echo": False,\
    "client_encoding": "utf8",\
    "connect_args": {"options": "-c timezone=utc"},}'

TEST_CONFIG_OVERRIDE = {
    "db": {
        "url": DB_URL,
        "url_read_replica": DB_URL,
        "engine_args_literal": ENGINE_ARGS_LITERAL,
        "run_migrations": "true",
    },
}


@contextmanager
def app_impl():
    # Drop DB, ensuring migration performed at start
    if database_exists(DB_URL):
        drop_database(DB_URL)

    create_database(DB_URL)

    # Drop redis
    redis = get_redis()
    redis.flushall()

    # Clear any existing logging config
    helpers.reset_logging()

    # Run db migrations because the db gets dropped at the start of the tests
    alembic_dir = os.getcwd()
    alembic_config = alembic.config.Config(f"{alembic_dir}/alembic.ini")
    alembic_config.set_main_option("sqlalchemy.url", str(DB_URL))
    alembic_config.set_main_option("mode", "test")
    with helpers.cd(alembic_dir):
        alembic.command.upgrade(alembic_config, "head")

    # Create application for testing
    discovery_provider_app = create_app(TEST_CONFIG_OVERRIDE)

    yield discovery_provider_app


@pytest.fixture
def app():
    with app_impl() as app:
        yield app


@pytest.fixture(scope="module")
def app_module():
    with app_impl() as app:
        yield app


@pytest.fixture(scope="session")
def celery_config():
    return {
        "broker_url": TEST_BROKER_URL,
        "imports": ["src.tasks.index"],
        "task_serializer": "json",
        "accept_content": ["json"],
        "task_always_eager": True,
    }


@pytest.fixture(scope="module")
def celery_app():
    """
    Configures a test fixture for celery.
    Usage:
    ```
    def test_something(celery_app):
        task = celery_app.celery.tasks["update_something"]
        db = task.db
        with db.scoped_session():
            pass
    ```

    Note: This fixture must be at module scope because celery
    works by autodiscovering tasks with a decorator at import time of a module.
    If you try to use celery as a fixture at the function scope,
    you will run into mysterious errors as some task context may be stale!
    """
    # Drop DB, ensuring migration performed at start
    if database_exists(DB_URL):
        drop_database(DB_URL)

    create_database(DB_URL)

    # Drop redis
    redis = get_redis()
    redis.flushall()

    # Clear any existing logging config
    helpers.reset_logging()

    # Run db migrations because the db gets dropped at the start of the tests
    alembic_dir = os.getcwd()
    alembic_config = alembic.config.Config(f"{alembic_dir}/alembic.ini")
    alembic_config.set_main_option("sqlalchemy.url", str(DB_URL))
    alembic_config.set_main_option("mode", "test")
    with helpers.cd(alembic_dir):
        alembic.command.upgrade(alembic_config, "head")

    # Call to create_celery returns an object containing the following:
    # 'Celery' - base Celery application
    # 'celery' - src.tasks.celery_app
    # Hence, references to the discovery provider celery application
    # Are formatted as:
    #   'celery_app.celery._some_res_or_func'
    celery_app = create_celery(TEST_CONFIG_OVERRIDE)

    yield celery_app
    if database_exists(DB_URL):
        drop_database(DB_URL)
    redis.flushall()


@pytest.fixture
def client(app):  # pylint: disable=redefined-outer-name
    return app.test_client()


def init_contracts(config):
    """
    Initializes contracts given an app/celery level config and returns
    deployed contract addresses.
    """
    # Create web3 provider to real ganache
    web3endpoint = f"http://{config['web3']['host']}:{config['web3']['port']}"
    web3 = Web3(HTTPProvider(web3endpoint))

    # set pre-funded account as sender
    web3.eth.default_account = web3.eth.accounts[0]

    registry_address = web3.toChecksumAddress(config["contracts"]["registry"])

    abi_values = helpers.load_abi_values()
    registry_return_val = web3.eth.contract(
        address=registry_address, abi=abi_values["Registry"]["abi"]
    )

    # Get addresses for contracts from the registry
    user_factory_address = registry_return_val.functions.getContract(
        bytes("UserFactory", "utf-8")
    ).call()
    track_factory_address = registry_return_val.functions.getContract(
        bytes("TrackFactory", "utf-8")
    ).call()
    user_replica_set_manager_address = registry_return_val.functions.getContract(
        bytes("UserReplicaSetManager", "utf-8")
    ).call()

    # Initialize contracts
    user_factory_contract = web3.eth.contract(
        address=user_factory_address, abi=abi_values["UserFactory"]["abi"]
    )
    track_factory_contract = web3.eth.contract(
        address=track_factory_address, abi=abi_values["TrackFactory"]["abi"]
    )
    user_replica_set_manager_contract = web3.eth.contract(
        address=user_replica_set_manager_address,
        abi=abi_values["UserReplicaSetManager"]["abi"],
    )

    return {
        "abi_values": abi_values,
        "registry_address": registry_address,
        "user_factory_address": user_factory_address,
        "user_factory_contract": user_factory_contract,
        "track_factory_address": track_factory_address,
        "track_factory_contract": track_factory_contract,
        "user_replica_set_manager_address": user_replica_set_manager_address,
        "user_replica_set_manager_contract": user_replica_set_manager_contract,
        "web3": web3,
    }


@pytest.fixture
def contracts(app):  # pylint: disable=redefined-outer-name
    """
    Initializes contracts to be used with the `app` fixture
    """
    return init_contracts(app.config)


@pytest.fixture
def celery_app_contracts(celery_app):  # pylint: disable=redefined-outer-name
    """
    Initializes contracts to be used with the `celery_app` fixture
    """
    # Pull singletons off of the default first task
    task = celery_app.celery.tasks["update_discovery_provider"]
    return init_contracts(task.shared_config)


postgresql_my = factories.postgresql("postgresql_nooproc")


# Returns Postgres DB session, and configures
# SQLAlchemy to use said connection.
# This fixture is primarily used by the
# `postgres_mock_db` fixture, and probably shouldn't
# be consumed directly by a test.
#
# More or less follows steps here:
# https://medium.com/@geoffreykoh/fun-with-fixtures-for-database-applications-8253eaf1a6d
# pylint: disable=W0621
@pytest.fixture(scope="function")
def setup_database(postgresql_my):
    def dbcreator():
        return postgresql_my.cursor().connection

    engine = create_engine("postgresql+psycopg2://", creator=dbcreator)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # pytest allows you to yield a value as
    # a return, and any code following the yield
    # is run as cleanup after test execution
    yield session
    session.close()


# Returns a mocked db instance.
#
# Calls setup_database
# to set up SQLAlchemy with Postgres.
#
# Monkeypatches get_db_read_replica
# to return this mocked db instance.
# pylint: disable=W0621
@pytest.fixture(scope="function")
def postgres_mock_db(monkeypatch, setup_database):
    # A mock Session, with __enter__ and __exit
    # methods so we can follow the standard
    # `with db.scoped_session() as session`
    # process.
    class MockSession:
        def __enter__(self):
            return setup_database

        def __exit__(self, type, value, tb):
            pass

        def scoped_session(self):
            return setup_database

    # A mock DB, which just returns
    # the MockSession.
    class MockDb:
        def scoped_session(self):
            return MockSession()

    mock = MockDb()

    def get_db_read_replica():
        return mock

    monkeypatch.setattr(
        src.utils.db_session, "get_db_read_replica", get_db_read_replica
    )

    return mock
