import logging
import os
import redis
import sqlalchemy

from flask import Blueprint, jsonify, request

from web3 import HTTPProvider, Web3
from src.models import Block
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.utils.config import shared_config
from src.utils.redis_constants import latest_block_redis_key, latest_block_hash_redis_key


logger = logging.getLogger(__name__)

bp = Blueprint("health_check", __name__)

web3endpoint = helpers.get_web3_endpoint(shared_config)
web3 = Web3(HTTPProvider(web3endpoint))
redis_url = shared_config["redis"]["url"]
redis = redis.Redis.from_url(url=redis_url)

disc_prov_version = helpers.get_discovery_provider_version()

default_healthy_block_diff = int(shared_config["discprov"]["healthy_block_diff"])

#### INTERNAL FUNCTIONS ####

# Returns DB block state & diff
def _get_db_block_state(latest_blocknum, latest_blockhash):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Fetch latest block from DB
        db_block_query = session.query(Block).filter(Block.is_current == True).all()
        assert len(db_block_query) == 1, "Expected SINGLE row marked as current"

        health_results = {
            "web": {
                "blocknumber": latest_blocknum,
                "blockhash": latest_blockhash,
            },
            "db": helpers.model_to_dictionary(db_block_query[0]),
            "git": os.getenv("GIT_SHA"),
        }

        block_difference = abs(
            health_results["web"]["blocknumber"] - health_results["db"]["number"]
        )
        health_results["block_difference"] = block_difference
        health_results["maximum_healthy_block_difference"] = default_healthy_block_diff
        health_results.update(disc_prov_version)

        return health_results

# Returns number of and info on open db connections
def _get_db_conn_state():
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Query number of open DB connections
        num_connections = session.execute(
            sqlalchemy.text("select sum(numbackends) from pg_stat_database;")
        ).fetchall()

        if not (num_connections and num_connections[0][0]):
            return jsonify('pg_stat_database query failed'), 500
        num_connections = num_connections[0][0]

        # Query connection info
        connection_info = session.execute(
            sqlalchemy.text("select datname, state, query, wait_event_type, wait_event from pg_stat_activity where state is not null;")
        ).fetchall()
        connection_info = [dict(row) for row in connection_info]

    return {"open_connections": num_connections, "connection_info": connection_info}


#### ROUTES ####

@bp.route("/version", methods=["GET"])
def version():
    return jsonify(disc_prov_version), 200

# Health check for server, db, and redis. Consumes latest block data from redis instead of chain.
# Optional boolean "verbose" flag to output db connection info.
# Optional boolean "enforce_block_diff" flag to error on unhealthy blockdiff.
# NOTE - can extend this in future to include ganache connectivity, how recently a block
#   has been added (ex. if it's been more than 30 minutes since last block), etc.
@bp.route("/health_check", methods=["GET"])
def health_check():
    # type = A callable that is used to cast the value
    verbose = request.args.get("verbose", type=str) == 'true'
    enforce_block_diff = request.args.get("enforce_block_diff", type=str) == 'true'

    # If the value given is not a valid int, will default to None
    qs_healthy_block_diff = request.args.get("healthy_block_diff", type=int)
    # If healthy block diff is given in url and positive, override config value
    healthy_block_diff = qs_healthy_block_diff if qs_healthy_block_diff is not None \
        and qs_healthy_block_diff >= 0 else default_healthy_block_diff

    latest_block_num = None
    latest_block_hash = None

    stored_latest_block_num = redis.get(latest_block_redis_key)
    if stored_latest_block_num is not None:
        latest_block_num = int(stored_latest_block_num)

    stored_latest_blockhash = redis.get(latest_block_hash_redis_key)
    if stored_latest_blockhash is not None:
        latest_block_hash = stored_latest_blockhash.decode("utf-8")

    if latest_block_num is None or latest_block_hash is None:
        latest_block = web3.eth.getBlock("latest", True)
        latest_block_num = latest_block.number
        latest_block_hash = latest_block.hash

    health_results = _get_db_block_state(latest_block_num, latest_block_hash)

    if verbose:
        # DB connections check
        health_results["db_connections"] = _get_db_conn_state()

    # Return error on unhealthy block diff if requested.
    if enforce_block_diff and health_results["block_difference"] > healthy_block_diff:
        return jsonify(health_results), 500

    return jsonify(health_results), 200

# Health check for block diff between DB and chain.
@bp.route("/block_check", methods=["GET"])
def block_check():
    # If the value given is not a valid int, will default to None
    qs_healthy_block_diff = request.args.get("healthy_block_diff", type=int)
    # If healthy block diff is given in url and positive, override config value
    healthy_block_diff = qs_healthy_block_diff if qs_healthy_block_diff is not None \
        and qs_healthy_block_diff >= 0 else default_healthy_block_diff

    latest_block = web3.eth.getBlock("latest", True)
    latest_block_num = latest_block.number
    latest_block_hash = latest_block.hash.hex()
    health_results = _get_db_block_state(latest_block_num, latest_block_hash)

    if health_results["block_difference"] > healthy_block_diff:
        return jsonify(health_results), 500

    return jsonify(health_results), 200
