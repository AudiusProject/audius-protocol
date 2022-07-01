from __future__ import absolute_import

import ast
import datetime
import logging
import time
from collections import defaultdict
from typing import Any, Dict

import redis
from celery.schedules import crontab, timedelta
from flask import Flask
from flask.json import JSONEncoder
from flask_cors import CORS
from sqlalchemy import exc
from sqlalchemy_utils import create_database, database_exists
from src import api_helpers, exceptions
from src.api.v1 import api as api_v1
from src.challenges.challenge_event_bus import setup_challenge_bus
from src.challenges.create_new_challenges import create_new_challenges
from src.database_task import DatabaseTask
from src.eth_indexing.event_scanner import eth_indexing_last_scanned_block_key
from src.queries import (
    block_confirmation,
    get_redirect_weights,
    health_check,
    index_block_stats,
    notifications,
    prometheus_metrics_exporter,
    queries,
    search,
    search_queries,
    skipped_transactions,
    user_signals,
)
from src.solana.anchor_program_indexer import AnchorProgramIndexer
from src.solana.solana_client_manager import SolanaClientManager
from src.tasks import celery_app
from src.tasks.index_reactions import INDEX_REACTIONS_LOCK
from src.tasks.update_track_is_available import UPDATE_TRACK_IS_AVAILABLE_LOCK
from src.utils import helpers
from src.utils.cid_metadata_client import CIDMetadataClient
from src.utils.config import ConfigIni, config_files, shared_config
from src.utils.multi_provider import MultiProvider
from src.utils.redis_metrics import METRICS_INTERVAL, SYNCHRONIZE_METRICS_INTERVAL
from src.utils.session_manager import SessionManager
from web3 import HTTPProvider, Web3
from werkzeug.middleware.proxy_fix import ProxyFix

# these global vars will be set in create_celery function
web3endpoint = None
web3 = None
abi_values = None

eth_web3 = None
eth_abi_values = None

solana_client_manager = None
registry = None
user_factory = None
track_factory = None
social_feature_factory = None
playlist_factory = None
user_library_factory = None
ipld_blacklist_factory = None
user_replica_set_manager = None
audius_data = None
contract_addresses: Dict[str, Any] = defaultdict()

logger = logging.getLogger(__name__)


def get_contract_addresses():
    return contract_addresses


def get_eth_abi_values():
    return eth_abi_values


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

    audius_data_address = "0xaf5C4C6C7920B4883bC6252e9d9B8fE27187Cf68"
    audius_data_inst = web3.eth.contract(
        address=audius_data_address,
        abi=abi_values["AudiusData"]["abi"]
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
        "audius_data": audius_data_address
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
        audius_data_inst,
        contract_address_dict,
    )


def create_app(test_config=None):
    return create(test_config)


def create_celery(test_config=None):
    # pylint: disable=W0603
    global web3endpoint, web3, abi_values, eth_abi_values, eth_web3
    global solana_client_manager

    web3endpoint = helpers.get_web3_endpoint(shared_config)
    web3 = Web3(HTTPProvider(web3endpoint))
    abi_values = helpers.load_abi_values()
    # Initialize eth_web3 with MultiProvider
    # We use multiprovider to allow for multiple web3 providers and additional resiliency.
    # However, we do not use multiprovider in data web3 because of the effect of disparate block status reads.
    eth_web3 = Web3(MultiProvider(shared_config["web3"]["eth_provider_url"]))
    eth_abi_values = helpers.load_eth_abi_values()

    # Initialize Solana web3 provider
    solana_client_manager = SolanaClientManager(shared_config["solana"]["endpoint"])

    global registry
    global user_factory
    global track_factory
    global social_feature_factory
    global playlist_factory
    global user_library_factory
    global ipld_blacklist_factory
    global user_replica_set_manager
    global audius_data
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
        audius_data,
        contract_addresses,
    ) = init_contracts()
    logger.info(f"contract_addresses_dict {contract_addresses}")

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
        CORS(app, max_age=86400, resources={r"/*": {"origins": "*"}})
    else:
        CORS(app, max_age=86400)
    app.iniconfig = ConfigIni()
    configure_flask(test_config, app, mode)

    if mode == "app":
        helpers.configure_flask_app_logging(
            app, shared_config["discprov"]["loglevel_flask"]
        )
        # Create challenges. Run the create_new_challenges only in flask
        # Running this in celery + flask init can cause a race condition
        session_manager = app.db_session_manager
        with session_manager.scoped_session() as session:
            create_new_challenges(session)
        return app

    if mode == "celery":
        # log level is defined via command line in docker yml files
        helpers.configure_logging()
        configure_celery(celery_app.celery, test_config)
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
    app.register_blueprint(index_block_stats.bp)
    app.register_blueprint(get_redirect_weights.bp)
    app.register_blueprint(block_confirmation.bp)
    app.register_blueprint(skipped_transactions.bp)
    app.register_blueprint(user_signals.bp)
    app.register_blueprint(prometheus_metrics_exporter.bp)

    app.register_blueprint(api_v1.bp)
    app.register_blueprint(api_v1.bp_full)

    return app


def delete_last_scanned_eth_block_redis(redis_inst):
    logger.info("index_eth.py | deleting existing redis scanned block on start")
    redis_inst.delete(eth_indexing_last_scanned_block_key)
    logger.info(
        "index_eth.py | successfully deleted existing redis scanned block on start"
    )


def configure_celery(celery, test_config=None):
    database_url = shared_config["db"]["url"]
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
            "src.tasks.index_metrics",
            "src.tasks.index_materialized_views",
            "src.tasks.index_aggregate_monthly_plays",
            "src.tasks.index_hourly_play_counts",
            "src.tasks.vacuum_db",
            "src.tasks.index_network_peers",
            "src.tasks.index_trending",
            "src.tasks.cache_user_balance",
            "src.monitors.monitoring_queue",
            "src.tasks.cache_trending_playlists",
            "src.tasks.index_solana_plays",
            "src.tasks.index_challenges",
            "src.tasks.index_user_bank",
            "src.tasks.index_eth",
            "src.tasks.index_oracles",
            "src.tasks.index_rewards_manager",
            "src.tasks.index_related_artists",
            "src.tasks.calculate_trending_challenges",
            "src.tasks.user_listening_history.index_user_listening_history",
            "src.tasks.prune_plays",
            "src.tasks.index_spl_token",
            "src.tasks.index_solana_user_data",
            "src.tasks.index_aggregate_tips",
            "src.tasks.index_reactions",
            "src.tasks.update_track_is_available",
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
            "index_hourly_play_counts": {
                "task": "index_hourly_play_counts",
                "schedule": timedelta(seconds=30),
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
                "schedule": timedelta(seconds=10),
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
            "index_related_artists": {
                "task": "index_related_artists",
                "schedule": timedelta(seconds=60),
            },
            "index_user_listening_history": {
                "task": "index_user_listening_history",
                "schedule": timedelta(seconds=5),
            },
            "index_aggregate_monthly_plays": {
                "task": "index_aggregate_monthly_plays",
                "schedule": crontab(minute=0, hour=0),  # daily at midnight
            },
            "prune_plays": {
                "task": "prune_plays",
                "schedule": crontab(
                    minute="*/15",
                    hour="14, 15",
                ),  # 8x a day during non peak hours
            },
            "index_spl_token": {
                "task": "index_spl_token",
                "schedule": timedelta(seconds=5),
            },
            "index_aggregate_tips": {
                "task": "index_aggregate_tips",
                "schedule": timedelta(seconds=5),
            },
            "index_reactions": {
                "task": "index_reactions",
                "schedule": timedelta(seconds=5),
            },
            "update_track_is_available": {
                "task": "update_track_is_available",
                "schedule": timedelta(hours=12),  # run every 12 hours
            }
            # UNCOMMENT BELOW FOR MIGRATION DEV WORK
            # "index_solana_user_data": {
            #     "task": "index_solana_user_data",
            #     "schedule": timedelta(seconds=5),
            # },
        },
        task_serializer="json",
        accept_content=["json"],
        broker_url=redis_url,
    )

    # Initialize DB object for celery task context
    db = SessionManager(
        database_url, ast.literal_eval(shared_config["db"]["engine_args_literal"])
    )
    logger.info("Database instance initialized!")

    # Initialize Redis connection
    redis_inst = redis.Redis.from_url(url=redis_url)

    # Initialize CIDMetadataClient for celery task context
    cid_metadata_client = CIDMetadataClient(
        eth_web3,
        shared_config,
        redis_inst,
        eth_abi_values,
    )

    # Clear last scanned redis block on startup
    delete_last_scanned_eth_block_redis(redis_inst)

    # Initialize Anchor Indexer
    anchor_program_indexer = AnchorProgramIndexer(
        shared_config["solana"]["anchor_data_program_id"],
        shared_config["solana"]["anchor_admin_storage_public_key"],
        "index_solana_user_data",
        redis_inst,
        db,
        solana_client_manager,
        cid_metadata_client,
    )

    # Clear existing locks used in tasks if present
    redis_inst.delete("disc_prov_lock")
    redis_inst.delete("network_peers_lock")
    redis_inst.delete("materialized_view_lock")
    redis_inst.delete("update_metrics_lock")
    redis_inst.delete("update_play_count_lock")
    redis_inst.delete("index_hourly_play_counts_lock")
    redis_inst.delete("ipld_blacklist_lock")
    redis_inst.delete("update_discovery_lock")
    redis_inst.delete("aggregate_metrics_lock")
    redis_inst.delete("synchronize_metrics_lock")
    redis_inst.delete("solana_plays_lock")
    redis_inst.delete("index_challenges_lock")
    redis_inst.delete("user_bank_lock")
    redis_inst.delete("index_eth_lock")
    redis_inst.delete("index_oracles_lock")
    redis_inst.delete("solana_rewards_manager_lock")
    redis_inst.delete("calculate_trending_challenges_lock")
    redis_inst.delete("index_user_listening_history_lock")
    redis_inst.delete("prune_plays_lock")
    redis_inst.delete("update_aggregate_table:aggregate_user_tips")
    redis_inst.delete(INDEX_REACTIONS_LOCK)
    redis_inst.delete(UPDATE_TRACK_IS_AVAILABLE_LOCK)

    logger.info("Redis instance initialized!")

    # Initialize custom task context with database object
    class WrappedDatabaseTask(DatabaseTask):
        def __init__(self, *args, **kwargs):
            DatabaseTask.__init__(
                self,
                db=db,
                web3=web3,
                abi_values=abi_values,
                eth_abi_values=eth_abi_values,
                shared_config=shared_config,
                cid_metadata_client=cid_metadata_client,
                redis=redis_inst,
                eth_web3_provider=eth_web3,
                solana_client_manager=solana_client_manager,
                challenge_event_bus=setup_challenge_bus(),
                anchor_program_indexer=anchor_program_indexer,
            )

    celery.autodiscover_tasks(["src.tasks"], "index", True)

    # Subclassing celery task with discovery provider context
    # Provided through properties defined in 'DatabaseTask'
    celery.Task = WrappedDatabaseTask

    celery.finalize()
