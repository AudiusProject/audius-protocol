from __future__ import absolute_import
import pytest
from sqlalchemy_utils import database_exists, drop_database
from web3 import HTTPProvider, Web3
from src import create_app, create_celery
from src.utils import helpers

DB_URL = "postgresql+psycopg2://postgres:postgres@localhost/test_audius_discovery"
TEST_BROKER_URL = "redis://localhost:5379/0"
ENGINE_ARGS_LITERAL = '{ \
    "pool_size": 10, \
    "max_overflow": 0, \
    "pool_recycle": 3600, \
    "echo": False,\
    "client_encoding": "utf8",\
    "connect_args": {"options": "-c timezone=utc"},}'

TEST_CONFIG_OVERRIDE = {
    "db": {"url": DB_URL, "url_read_replica": DB_URL, "engine_args_literal": ENGINE_ARGS_LITERAL}
}


@pytest.fixture
def app():
    # Drop DB, ensuring migration performed at start
    if database_exists(DB_URL):
        drop_database(DB_URL)

    # Create application for testing
    discovery_provider_app = create_app(TEST_CONFIG_OVERRIDE)
    yield discovery_provider_app


@pytest.fixture(scope="session")
def celery_config():
    return {
        "broker_url": TEST_BROKER_URL,
        "imports": ["src.tasks.index"],
        "task_serializer": "json",
        "accept_content": ["json"],
        "task_always_eager": True,
    }


@pytest.fixture
def celery_app():
    # Call to create_celery returns an object containing the following:
    # 'Celery' - base Celery application
    # 'celery' - src.tasks.celery_app
    # Hence, references to the discovery provider celery application
    # Are formatted as:
    #   'celery_app.celery._some_res_or_func'
    return create_celery(TEST_CONFIG_OVERRIDE)


@pytest.fixture
def client(app):  # pylint: disable=redefined-outer-name
    return app.test_client()


@pytest.fixture
def contracts(app):  # pylint: disable=redefined-outer-name
    # Create web3 provider to real ganache
    web3endpoint = "http://{}:{}".format(
        app.config["web3"]["host"], app.config["web3"]["port"]
    )
    web3 = Web3(HTTPProvider(web3endpoint))

    # set pre-funded account as sender
    web3.eth.defaultAccount = web3.eth.accounts[0]

    registry_address = web3.toChecksumAddress(app.config["contracts"]["registry"])

    abi_values = helpers.loadAbiValues()
    registry_return_val = web3.eth.contract(
        address=registry_address, abi=abi_values["Registry"]["abi"]
    )
    user_factory_address = registry_return_val.functions.getContract(
        bytes("UserFactory", "utf-8")
    ).call()

    track_factory_address = registry_return_val.functions.getContract(
        bytes("TrackFactory", "utf-8")
    ).call()

    user_factory_contract = web3.eth.contract(
        address=user_factory_address, abi=abi_values["UserFactory"]["abi"]
    )

    track_factory_contract = web3.eth.contract(
        address=track_factory_address, abi=abi_values["TrackFactory"]["abi"]
    )

    return {
        "abi_values": abi_values,
        "registry_address": registry_address,
        "user_factory_address": user_factory_address,
        "user_factory_contract": user_factory_contract,
        "track_factory_address": track_factory_address,
        "track_factory_contract": track_factory_contract,
        "web3": web3,
    }
