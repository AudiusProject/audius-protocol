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

HEALTHY_BLOCK_DIFF = 100

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
        health_results["maximum_healthy_block_difference"] = HEALTHY_BLOCK_DIFF

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

# Consume cached latest block from redis
@bp.route("/health_check", methods=["GET"])
def health_check():
    # can extend this in future to include ganache connectivity, how recently a block
    # has been added (ex. if it's been more than 30 minutes since last block), etc.
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

    verbose = request.args.get("verbose", type=str) == 'true'
    if verbose:
        # DB connections check
        health_results["db_connections"] = _get_db_conn_state()

    if health_results["block_difference"] > HEALTHY_BLOCK_DIFF:
        return jsonify(health_results), 500

    return jsonify(health_results), 200

# Query latest block from web3 provider
@bp.route("/block_check", methods=["GET"])
def block_check():
    latest_block = web3.eth.getBlock("latest", True)
    latest_block_num = latest_block.number
    latest_block_hash = latest_block.hash.hex()
    health_results = _get_db_block_state(latest_block_num, latest_block_hash)

    if health_results["block_difference"] > HEALTHY_BLOCK_DIFF:
        return jsonify(health_results), 500

    return jsonify(health_results), 200
