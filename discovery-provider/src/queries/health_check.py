import logging
import os
import redis

from flask import Blueprint, jsonify

from web3 import HTTPProvider, Web3
from src.models import Block
from src.utils import helpers
from src.utils.db_session import get_db
from src.utils.config import shared_config
from src.utils.helpers import latest_block_redis_key, latest_block_hash_redis_key


logger = logging.getLogger(__name__)

bp = Blueprint("health_check", __name__)

web3endpoint = helpers.get_web3_endpoint(shared_config)
web3 = Web3(HTTPProvider(web3endpoint))
redis_url = shared_config["redis"]["url"]
redis = redis.Redis.from_url(url=redis_url)

disc_prov_version = helpers.get_discovery_provider_version()

@bp.route("/version", methods=["GET"])
def version():
    return jsonify(disc_prov_version), 200

def get_db_health_check_results(latest_blocknum, latest_blockhash):
    db = get_db()
    with db.scoped_session() as session:
        db_block_query = session.query(Block).filter(Block.is_current == True).all()
        assert len(db_block_query) == 1, "Expected SINGLE row marked as current"
        health_results = {
            "web": {
                "blocknumber": latest_blocknum,
                "blockhash": latest_blockhash,
            },
            "db": helpers.model_to_dictionary(db_block_query[0]),
            "healthy": True,
            "git": os.getenv("GIT_SHA"),
        }
        logger.warning(health_results)
        block_difference = abs(
            health_results["web"]["blocknumber"] - health_results["db"]["number"]
        )
        health_results["block_difference"] = block_difference
        return health_results

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

    health_results = get_db_health_check_results(latest_block_num, latest_block_hash)

    if health_results["block_difference"] > 20:
        return jsonify(health_results), 500

    return jsonify(health_results), 200

# Query latest block from web3 provider
@bp.route("/block_check", methods=["GET"])
def block_check():
    latest_block = web3.eth.getBlock("latest", True)
    latest_block_num = latest_block.number
    latest_block_hash = latest_block.hash.hex()
    health_results = get_db_health_check_results(latest_block_num, latest_block_hash)

    if health_results["block_difference"] > 20:
        return jsonify(health_results), 500

    return jsonify(health_results), 200
