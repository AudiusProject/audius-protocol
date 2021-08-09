from __future__ import absolute_import

import ast
from collections import defaultdict
import datetime
import logging
import time
from typing import Any, Dict

import redis
from celery.schedules import crontab, timedelta
from flask import Flask
from flask.json import JSONEncoder
from flask_cors import CORS
from solana.rpc.api import Client
from sqlalchemy import exc
from sqlalchemy_utils import create_database, database_exists
from web3 import HTTPProvider, Web3
from werkzeug.middleware.proxy_fix import ProxyFix

from src import api_helpers, exceptions
from src.api.v1 import api as api_v1
from src.challenges.challenge_event_bus import setup_challenge_bus
from src.challenges.create_new_challenges import create_new_challenges
from src.database_task import DatabaseTask
from src.queries import (
    block_confirmation,
    health_check,
    notifications,
    queries,
    search,
    search_queries,
    skipped_transactions,
    user_signals,
)
from src.tasks import celery_app
from src.utils import helpers
from src.utils.config import ConfigIni, config_files, shared_config
from src.utils.ipfs_lib import IPFSClient
from src.utils.multi_provider import MultiProvider
from src.utils.redis_metrics import METRICS_INTERVAL, SYNCHRONIZE_METRICS_INTERVAL
from src.utils.session_manager import SessionManager

SOLANA_ENDPOINT = shared_config["solana"]["endpoint"]

# these global vars will be set in create_celery function
web3endpoint = None
web3 = None
abi_values = None

eth_web3 = None
eth_abi_values = None

solana_client = None
registry = None
user_factory = None
track_factory = None
social_feature_factory = None
playlist_factory = None
user_library_factory = None
ipld_blacklist_factory = None
user_replica_set_manager = None
contract_addresses: Dict[str, Any] = defaultdict()

logger = logging.getLogger(__name__)


def init_contracts():
    registry_address = web3.toChecksumAddress(shared_config["contracts"]["registry"])
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
        address=social_feature_factory_address,
        abi=abi_values["SocialFeatureFactory"]["abi"],
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
        address=user_library_factory_address,
        abi=abi_values["UserLibraryFactory"]["abi"],
    )

    ipld_blacklist_factory_address = registry_instance.functions.getContract(
        bytes("IPLDBlacklistFactory", "utf-8")
    ).call()
    ipld_blacklist_factory_inst = web3.eth.contract(
        address=user_library_factory_address,
        abi=abi_values["UserLibraryFactory"]["abi"],
    )

    user_replica_set_manager_address = registry_instance.functions.getContract(
        bytes("UserReplicaSetManager", "utf-8")
    ).call()
    user_replica_set_manager_inst = web3.eth.contract(
        address=user_replica_set_manager_address,
        abi=abi_values["UserReplicaSetManager"]["abi"],
    )

    contract_address_dict = {
        "registry": registry_address,
        "user_factory": user_factory_address,
        "track_factory": track_factory_address,
        "social_feature_factory": social_feature_factory_address,
        "playlist_factory": playlist_factory_address,
        "user_library_factory": user_library_factory_address,
        "ipld_blacklist_factory": ipld_blacklist_factory_address,
        "user_replica_set_manager": user_replica_set_manager_address,
    }

    return (
        registry_instance,
        user_factory_instance,
        track_factory_instance,
        social_feature_factory_inst,
        playlist_factory_inst,
        user_library_factory_inst,
        ipld_blacklist_factory_inst,
        user_replica_set_manager_inst,
        contract_address_dict,
    )


def create_app(test_config=None):
    return create(test_config)


def create_celery(test_config=None):
    # pylint: disable=W0603
    global web3endpoint, web3, abi_values, eth_abi_values, eth_web3
    global solana_client

    web3endpoint = helpers.get_web3_endpoint(shared_config)
    web3 = Web3(HTTPProvider(web3endpoint))
    abi_values = helpers.load_abi_values()
    eth_abi_values = helpers.load_eth_abi_values()
    # Initialize eth_web3 with MultiProvider
    # We use multiprovider to allow for multiple web3 providers and additional resiliency.
    # However, we do not use multiprovider in data web3 because of the effect of disparate block status reads.
    eth_web3 = Web3(MultiProvider(shared_config["web3"]["eth_provider_url"]))

    # Initialize Solana web3 provider
    solana_client = Client(SOLANA_ENDPOINT)

    global registry
    global user_factory
    global track_factory
    global social_feature_factory
    global playlist_factory
    global user_library_factory
    global ipld_blacklist_factory
    global user_replica_set_manager
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
        user_replica_set_manager,
        contract_addresses,
    ) = init_contracts()

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
        helpers.configure_flask_app_logging(
            app, shared_config["discprov"]["loglevel_flask"]
        )
        return app

    if mode == "celery":
        # log level is defined via command line in docker yml files
        helpers.configure_logging()
        configure_celery(app, celery_app.celery, test_config)
        return celery_app

    raise ValueError("Invalid mode")


def register_exception_handlers(flask_app):
    # catch exceptions thrown by us and propagate error message through
    @flask_app.errorhandler(exceptions.Base)
    def handle_audius_error(error):  # pylint: disable=W0612
        logger.exception("Audius-derived exception")
        return api_helpers.error_response(str(error), 400)

    # show a common error message for exceptions not thrown by us
    @flask_app.errorhandler(Exception)
    def handle_exception(_error):  # pylint: disable=W0612
        logger.exception("Non Audius-derived exception")
        return api_helpers.error_response(["Something caused the server to crash."])

    @flask_app.errorhandler(404)
    def handle_404(_error):  # pylint: disable=W0612
        return api_helpers.error_response(["Route does not exist"], 404)


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

    # Register route blueprints
    register_exception_handlers(app)
    app.register_blueprint(queries.bp)
    app.register_blueprint(search.bp)
    app.register_blueprint(search_queries.bp)
    app.register_blueprint(notifications.bp)
    app.register_blueprint(health_check.bp)
    app.register_blueprint(block_confirmation.bp)
    app.register_blueprint(skipped_transactions.bp)
    app.register_blueprint(user_signals.bp)

    app.register_blueprint(api_v1.bp)
    app.register_blueprint(api_v1.bp_full)

    # Create challenges
    session_manager = app.db_session_manager
    with session_manager.scoped_session() as session:
        create_new_challenges(session)

    return app


def configure_celery(flask_app, celery, test_config=None):
    database_url = shared_config["db"]["url"]
    engine_args_literal = ast.literal_eval(shared_config["db"]["engine_args_literal"])
    redis_url = shared_config["redis"]["url"]

    if test_config is not None:
        if "db" in test_config:
            if "url" in test_config["db"]:
                database_url = test_config["db"]["url"]

    ipld_interval = int(shared_config["discprov"]["blacklist_block_indexing_interval"])
    # default is 5 seconds
    indexing_interval_sec = int(
        shared_config["discprov"]["block_processing_interval_sec"]
    )

    # Update celery configuration
    celery.conf.update(
        imports=[
            "src.tasks.index",
            "src.tasks.index_blacklist",
            "src.tasks.index_plays",
            "src.tasks.index_metrics",
            "src.tasks.index_materialized_views",
            "src.tasks.vacuum_db",
            "src.tasks.index_network_peers",
            "src.tasks.index_trending",
            "src.tasks.cache_user_balance",
            "src.monitors.monitoring_queue",
            "src.tasks.cache_trending_playlists",
            "src.tasks.index_solana_plays",
            "src.tasks.index_aggregate_views",
            "src.tasks.index_challenges",
            "src.tasks.index_user_bank",
            "src.tasks.index_eth",
            "src.tasks.index_oracles",
            "src.tasks.index_rewards_manager",
        ],
        beat_schedule={
            "update_discovery_provider": {
                "task": "update_discovery_provider",
                "schedule": timedelta(seconds=indexing_interval_sec),
            },
            "update_ipld_blacklist": {
                "task": "update_ipld_blacklist",
                "schedule": timedelta(seconds=ipld_interval),
            },
            "update_play_count": {
                "task": "update_play_count",
                "schedule": timedelta(seconds=60),
            },
            "update_metrics": {
                "task": "update_metrics",
                "schedule": crontab(minute=0, hour="*"),
            },
            "aggregate_metrics": {
                "task": "aggregate_metrics",
                "schedule": timedelta(minutes=METRICS_INTERVAL),
            },
            "synchronize_metrics": {
                "task": "synchronize_metrics",
                "schedule": timedelta(minutes=SYNCHRONIZE_METRICS_INTERVAL),
            },
            "update_materialized_views": {
                "task": "update_materialized_views",
                "schedule": timedelta(seconds=300),
            },
            "vacuum_db": {
                "task": "vacuum_db",
                "schedule": timedelta(days=1),
            },
            "update_network_peers": {
                "task": "update_network_peers",
                "schedule": timedelta(seconds=30),
            },
            "index_trending": {
                "task": "index_trending",
                "schedule": crontab(minute=15, hour="*"),
            },
            "update_user_balances": {
                "task": "update_user_balances",
                "schedule": timedelta(seconds=60),
            },
            "monitoring_queue": {
                "task": "monitoring_queue",
                "schedule": timedelta(seconds=60),
            },
            "cache_trending_playlists": {
                "task": "cache_trending_playlists",
                "schedule": timedelta(minutes=30),
            },
            "index_solana_plays": {
                "task": "index_solana_plays",
                "schedule": timedelta(seconds=5),
            },
            "update_aggregate_user": {
                "task": "update_aggregate_user",
                "schedule": timedelta(seconds=30),
            },
            "update_aggregate_track": {
                "task": "update_aggregate_track",
                "schedule": timedelta(seconds=30),
            },
            "update_aggregate_playlist": {
                "task": "update_aggregate_playlist",
                "schedule": timedelta(seconds=30),
            },
            "index_user_bank": {
                "task": "index_user_bank",
                "schedule": timedelta(seconds=5),
            },
            "index_challenges": {
                "task": "index_challenges",
                "schedule": timedelta(seconds=5),
            },
            "index_eth": {
                "task": "index_eth",
                "schedule": timedelta(seconds=10),
            },
            "index_oracles": {
                "task": "index_oracles",
                "schedule": timedelta(minutes=5),
            },
            "index_rewards_manager": {
                "task": "index_rewards_manager",
                "schedule": timedelta(seconds=5),
            },
        },
        task_serializer="json",
        accept_content=["json"],
        broker_url=redis_url,
    )

    # Initialize DB object for celery task context
    db = SessionManager(database_url, engine_args_literal)
    logger.info("Database instance initialized!")
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
    redis_inst.delete("aggregate_metrics_lock")
    redis_inst.delete("synchronize_metrics_lock")
    redis_inst.delete("solana_plays_lock")
    redis_inst.delete("index_challenges")
    redis_inst.delete("user_bank_lock")
    redis_inst.delete("index_eth")
    redis_inst.delete("index_oracles")
    redis_inst.delete("solana_rewards_manager")
    logger.info("Redis instance initialized!")

    # Initialize custom task context with database object
    class WrappedDatabaseTask(DatabaseTask):
        def __init__(self, *args, **kwargs):
            DatabaseTask.__init__(
                self,
                db=db,
                web3=web3,
                abi_values=abi_values,
                shared_config=shared_config,
                ipfs_client=ipfs_client,
                redis=redis_inst,
                eth_web3_provider=eth_web3,
                solana_client=solana_client,
                challenge_event_bus=setup_challenge_bus(),
            )

    celery.autodiscover_tasks(["src.tasks"], "index", True)

    # Subclassing celery task with discovery provider context
    # Provided through properties defined in 'DatabaseTask'
    celery.Task = WrappedDatabaseTask

    celery.finalize()
