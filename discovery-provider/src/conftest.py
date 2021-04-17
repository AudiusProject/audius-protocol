"""
Test fixtures to support unit testing
"""
from unittest.mock import MagicMock
import pytest
import fakeredis
import src.utils.redis_connection
import src.utils.web3_provider
import src.utils.db_session

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


# Test fixture that mocks getting monitor values
@pytest.fixture()
def get_monitors_mock(monkeypatch):
    mock_get_monitors = MagicMock()

    def get_monitors(monitors):
        return mock_get_monitors()

    monkeypatch.setattr(
        src.monitors.monitors,
        'get_monitors',
        get_monitors
    )
    return mock_get_monitors
