from __future__ import absolute_import
import os
import logging
import ast
import datetime
import time

from web3 import HTTPProvider, Web3
from werkzeug.middleware.proxy_fix import ProxyFix
from sqlalchemy_utils import database_exists, create_database
from sqlalchemy import exc
from celery import Task
from celery.schedules import timedelta, crontab

import redis
from flask import Flask
from flask.json import JSONEncoder
from flask_cors import CORS

import alembic
import alembic.config  # pylint: disable=E0611

from src import exceptions
from src.queries import queries, search, search_queries, health_check, trending, notifications
from src.api.v1 import api as api_v1
from src.utils import helpers, config
from src.utils.session_manager import SessionManager
from src.utils.config import config_files, shared_config, ConfigIni
from src.utils.ipfs_lib import IPFSClient
from src.tasks import celery_app

# these global vars will be set in create_celery function
web3endpoint = None
web3 = None
abi_values = None

eth_web3 = None
eth_abi_values = None

registry = None
user_factory = None
track_factory = None
social_feature_factory = None
playlist_factory = None
user_library_factory = None
ipld_blacklist_factory = None
contract_addresses = None

logger = logging.getLogger(__name__)


def initContracts():
    registry_address = web3.toChecksumAddress(
        shared_config["contracts"]["registry"])
    registry_instance = web3.eth.contract(
        address=registry_address, abi=abi_values["Registry"]["abi"]
    )

    user_factory_address = registry_instance.functions.getContract(
        bytes("UserFactory", "utf-8")
    ).call()
    user_factory_instance = web3.eth.contract(
        address=user_factory_address, abi=abi_values["UserFactory"]["abi"]
    )
    track_factory_address = registry_instance.functions.getContract(
        bytes("TrackFactory", "utf-8")
    ).call()
    track_factory_instance = web3.eth.contract(
        address=track_factory_address, abi=abi_values["TrackFactory"]["abi"]
    )

    social_feature_factory_address = registry_instance.functions.getContract(
        bytes("SocialFeatureFactory", "utf-8")
    ).call()
    social_feature_factory_inst = web3.eth.contract(
        address=social_feature_factory_address, abi=abi_values["SocialFeatureFactory"]["abi"]
    )

    playlist_factory_address = registry_instance.functions.getContract(
        bytes("PlaylistFactory", "utf-8")
    ).call()
    playlist_factory_inst = web3.eth.contract(
        address=playlist_factory_address, abi=abi_values["PlaylistFactory"]["abi"]
    )

    user_library_factory_address = registry_instance.functions.getContract(
        bytes("UserLibraryFactory", "utf-8")
    ).call()
    user_library_factory_inst = web3.eth.contract(
        address=user_library_factory_address, abi=abi_values["UserLibraryFactory"]["abi"]
    )

    ipld_blacklist_factory_address = registry_instance.functions.getContract(
        bytes("IPLDBlacklistFactory", "utf-8")
    ).call()
    ipld_blacklist_factory_inst = web3.eth.contract(
        address=user_library_factory_address, abi=abi_values["UserLibraryFactory"]["abi"]
    )

    contract_address_dict = {
        "registry": registry_address,
        "user_factory": user_factory_address,
        "track_factory": track_factory_address,
        "social_feature_factory": social_feature_factory_address,
        "playlist_factory": playlist_factory_address,
        "user_library_factory": user_library_factory_address,
        "ipld_blacklist_factory": ipld_blacklist_factory_address
    }

    return (
        registry_instance,
        user_factory_instance,
        track_factory_instance,
        social_feature_factory_inst,
        playlist_factory_inst,
        user_library_factory_inst,
        ipld_blacklist_factory_inst,
        contract_address_dict,
    )

def create_app(test_config=None):
    return create(test_config)

def create_celery(test_config=None):
    # pylint: disable=W0603
    global web3endpoint, web3, abi_values, eth_abi_values, eth_web3

    web3endpoint = helpers.get_web3_endpoint(shared_config)
    web3 = Web3(HTTPProvider(web3endpoint))
    abi_values = helpers.load_abi_values()
    eth_abi_values = helpers.load_eth_abi_values()
    # Initialize eth web
    eth_web3 = Web3(HTTPProvider(shared_config["web3"]["eth_provider_url"]))

    global registry
    global user_factory
    global track_factory
    global social_feature_factory
    global playlist_factory
    global user_library_factory
    global ipld_blacklist_factory
    global contract_addresses
    # pylint: enable=W0603

    (
        registry,
        user_factory,
        track_factory,
        social_feature_factory,
        playlist_factory,
        user_library_factory,
        ipld_blacklist_factory,
        contract_addresses
    ) = initContracts()

    return create(test_config, mode="celery")

def create(test_config=None, mode="app"):
    arg_type = type(mode)
    assert isinstance(mode, str), f"Expected string, provided {arg_type}"
    assert mode in ("app", "celery"), f"Expected app/celery, provided {mode}"

    app = Flask(__name__)

    # Tell Flask that it should respect the X-Forwarded-For and X-Forwarded-Proto
    # headers coming from a proxy (if any).
    # On its own Flask's `url_for` is not very smart and if you're serving
    # traffic through an HTTPS proxy, `url_for` will create URLs with the HTTP
    # protocol. This is the cannonical solution.
    # https://werkzeug.palletsprojects.com/en/1.0.x/middleware/proxy_fix/
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)

    if shared_config["cors"]["allow_all"]:
        CORS(app, resources={r"/*": {"origins": "*"}})
    else:
        CORS(app)
    app.iniconfig = ConfigIni()
    configure_flask(test_config, app, mode)

    if mode == "app":
        helpers.configure_flask_app_logging(app, shared_config["discprov"]["loglevel_flask"])
        return app

    if mode == "celery":
        # log level is defined via command line in docker yml files
        helpers.configure_logging()
        configure_celery(app, celery_app.celery, test_config)
        return celery_app

    raise ValueError("Invalid mode")


def configure_flask(test_config, app, mode="app"):
    with app.app_context():
        app.iniconfig.read(config_files)

    # custom JSON serializer for timestamps
    class TimestampJSONEncoder(JSONEncoder):
        # pylint: disable=E0202
        def default(self, o):
            if isinstance(o, datetime.datetime):
                # ISO-8601 timestamp format
                return o.strftime("%Y-%m-%dT%H:%M:%S Z")
            return JSONEncoder.default(self, o)
    app.json_encoder = TimestampJSONEncoder

    database_url = app.config["db"]["url"]
    if test_config is not None:
        if "db" in test_config:
            if "url" in test_config["db"]:
                database_url = test_config["db"]["url"]

    # Sometimes ECS latency causes the create_database function to fail because db connection is not ready
    # Give it some more time to get set up, up to 5 times
    i = 0
    while i < 5:
        try:
            # Create database if necessary
            if not database_exists(database_url):
                create_database(database_url)
            else:
                break
        except exc.OperationalError as e:
            if "could not connect to server" in str(e):
                logger.warning(
                    "DB connection isn't up yet...setting a temporary timeout and trying again"
                )
                time.sleep(10)
            else:
                raise e

        i += 1

    # Conditionally perform alembic database upgrade to HEAD during
    # flask initialization
    if mode == "app":
        alembic_dir = os.getcwd()
        alembic_config = alembic.config.Config(f"{alembic_dir}/alembic.ini")
        alembic_config.set_main_option("sqlalchemy.url", str(database_url))
        with helpers.cd(alembic_dir):
            alembic.command.upgrade(alembic_config, "head")

    if test_config is not None:
        # load the test config if passed in
        app.config.update(test_config)

    app.db_session_manager = SessionManager(
        app.config["db"]["url"],
        ast.literal_eval(app.config["db"]["engine_args_literal"]),
    )

    app.db_read_replica_session_manager = SessionManager(
        app.config["db"]["url_read_replica"],
        ast.literal_eval(app.config["db"]["engine_args_literal"]),
    )


    exceptions.register_exception_handlers(app)
    app.register_blueprint(queries.bp)
    app.register_blueprint(trending.bp)
    app.register_blueprint(search.bp)
    app.register_blueprint(search_queries.bp)
    app.register_blueprint(notifications.bp)
    app.register_blueprint(health_check.bp)

    app.register_blueprint(api_v1.bp)
    app.register_blueprint(api_v1.bp_full)

    return app


def configure_celery(flask_app, celery, test_config=None):
    database_url = shared_config["db"]["url"]
    engine_args_literal = ast.literal_eval(
        shared_config["db"]["engine_args_literal"])
    redis_url = shared_config["redis"]["url"]

    if test_config is not None:
        if "db" in test_config:
            if "url" in test_config["db"]:
                database_url = test_config["db"]["url"]

    # Update celery configuration
    celery.conf.update(
        imports=["src.tasks.index", "src.tasks.index_blacklist",
                 "src.tasks.index_plays", "src.tasks.index_metrics",
                 "src.tasks.index_materialized_views",
                 "src.tasks.index_network_peers", "src.tasks.index_trending",
                 "src.tasks.cache_user_balance"
                 ],
        beat_schedule={
            "update_discovery_provider": {
                "task": "update_discovery_provider",
                "schedule": timedelta(seconds=5),
            },
            "update_ipld_blacklist": {
                "task": "update_ipld_blacklist",
                "schedule": timedelta(seconds=60),
            },
            "update_play_count": {
                "task": "update_play_count",
                "schedule": timedelta(seconds=60)
            },
            "update_metrics": {
                "task": "update_metrics",
                "schedule": crontab(minute=0, hour="*")
            },
            "update_materialized_views": {
                "task": "update_materialized_views",
                "schedule": timedelta(seconds=60)
            },
            "update_network_peers": {
                "task": "update_network_peers",
                "schedule": timedelta(seconds=30)
            },
            "index_trending": {
                "task": "index_trending",
                "schedule": crontab(minute=0, hour="*")
            },
            "update_user_balances": {
                "task": "update_user_balances",
                "schedule": timedelta(minutes=30)
            }
        },
        task_serializer="json",
        accept_content=["json"],
        broker_url=redis_url,
    )

    # Initialize DB object for celery task context
    db = SessionManager(database_url, engine_args_literal)
    logger.info('Database instance initialized!')
    # Initialize IPFS client for celery task context
    ipfs_client = IPFSClient(
        shared_config["ipfs"]["host"], shared_config["ipfs"]["port"]
    )

    # Initialize Redis connection
    redis_inst = redis.Redis.from_url(url=redis_url)
    # Clear existing locks used in tasks if present
    redis_inst.delete("disc_prov_lock")
    redis_inst.delete("network_peers_lock")
    redis_inst.delete("materialized_view_lock")
    redis_inst.delete("update_metrics_lock")
    redis_inst.delete("update_play_count_lock")
    redis_inst.delete("ipld_blacklist_lock")
    redis_inst.delete("update_discovery_lock")
    logger.info('Redis instance initialized!')

    # Initialize custom task context with database object
    class DatabaseTask(Task):
        def __init__(self, *args, **kwargs):
            self._db = db
            self._web3_provider = web3
            self._abi_values = abi_values
            self._shared_config = shared_config
            self._ipfs_client = ipfs_client
            self._redis = redis_inst
            self._eth_web3_provider = eth_web3

        @property
        def abi_values(self):
            return self._abi_values

        @property
        def web3(self):
            return self._web3_provider

        @property
        def db(self):
            return self._db

        @property
        def shared_config(self):
            return self._shared_config

        @property
        def ipfs_client(self):
            return self._ipfs_client

        @property
        def redis(self):
            return self._redis

        @property
        def eth_web3(self):
            return self._eth_web3_provider

    celery.autodiscover_tasks(["src.tasks"], "index", True)

    # Subclassing celery task with discovery provider context
    # Provided through properties defined in 'DatabaseTask'
    celery.Task = DatabaseTask

    celery.finalize()
