import logging
import os

from flask import Blueprint, jsonify

from web3 import HTTPProvider, Web3
from src.models import Block
from src.utils import helpers
from src.utils.db_session import get_db
from src.utils.config import shared_config


logger = logging.getLogger(__name__)


bp = Blueprint("health_check", __name__)

web3endpoint = helpers.get_web3_endpoint(shared_config)
web3 = Web3(HTTPProvider(web3endpoint))

disc_prov_version = helpers.get_discovery_provider_version()

@bp.route("/version", methods=["GET"])
def version():
    return jsonify(disc_prov_version), 200

@bp.route("/health_check", methods=["GET"])
def health_check():
    db = get_db()
    with db.scoped_session() as session:
        # can extend this in future to include ganache connectivity, how recently a block
        # has been added (ex. if it's been more than 30 minutes since last block), etc.
        latest_block = web3.eth.getBlock("latest", True)
        db_block_query = session.query(Block).filter(Block.is_current == True).all()
        assert len(db_block_query) == 1, "Expected SINGLE row marked as current"
        health_results = {
            "web": {
                "blocknumber": latest_block.number,
                "blockhash": latest_block.hash.hex(),
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

        if block_difference > 20:
            return jsonify(health_results), 500

        return jsonify(health_results), 200
