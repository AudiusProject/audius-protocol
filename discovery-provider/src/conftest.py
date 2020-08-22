"""
Test fixtures to support unit testing
"""

from unittest.mock import MagicMock
import pytest
import fakeredis
import src.utils.redis_connection
import src.utils.web3_provider
import src.utils.db_session
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from pytest_postgresql import factories
from src.models import Base

socket_dir = tempfile.TemporaryDirectory()
postgresql_my_proc = factories.postgresql_proc(
    port=None, unixsocketdir=socket_dir.name)
postgresql_my = factories.postgresql('postgresql_my_proc')

# Returns Postgres DB session, and configures
# SQLAlchemy to use said connection.
# This fixture is primarily used by the
# `postgres_mock_db` fixture, and probably shouldn't
# be consumed directly by a test.
#
# More or less follows steps here:
# https://medium.com/@geoffreykoh/fun-with-fixtures-for-database-applications-8253eaf1a6d
@pytest.fixture(scope='function')
def setup_database(postgresql_my):

    def dbcreator():
        return postgresql_my.cursor().connection

    engine = create_engine('postgresql+psycopg2://', creator=dbcreator)
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
@pytest.fixture(scope='function')
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
        src.utils.db_session,
        'get_db_read_replica',
        get_db_read_replica
    )

    return mock


# Test fixture to mock a postgres database using an in-memory alternative
@pytest.fixture()
def db_mock(monkeypatch):
    db = src.utils.session_manager.SessionManager(
        'sqlite://',
        {}
    )

    def get_db_read_replica():
        return db

    monkeypatch.setattr(
        src.utils.db_session,
        'get_db_read_replica',
        get_db_read_replica
    )

    return db


# Test fixture to mock a web3 provider
@pytest.fixture()
def web3_mock(monkeypatch):
    web3 = MagicMock()

    def get_web3():
        return web3

    monkeypatch.setattr(
        src.utils.web3_provider,
        'get_web3',
        get_web3
    )
    return web3


# Test fixture to mock a redis connection
@pytest.fixture()
def redis_mock(monkeypatch):
    redis = fakeredis.FakeStrictRedis()

    def get_redis():
        return redis

    monkeypatch.setattr(
        src.utils.redis_connection,
        'get_redis',
        get_redis
    )
    return redis
