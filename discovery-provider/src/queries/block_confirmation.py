import logging
from flask import Blueprint, request
from src.queries.get_block_confirmation import get_block_confirmation
from src.api_helpers import success_response, error_response

logger = logging.getLogger(__name__)

bp = Blueprint("block_confirmation", __name__)

@bp.route("/block_confirmation", methods=["GET"])
def block_confirmation():
    blockhash = request.args.get("blockhash")
    blocknumber = request.args.get("blocknumber", type=int)
    response = {"block_found": False, "block_passed": False}
    bad_request = True
    if blockhash is not None and blocknumber is not None:
        bad_request = False
        logger.info(f"block_confirmation | ARGS: {blockhash, blocknumber}")
        try:
            response = get_block_confirmation(blockhash, blocknumber)
        except Exception as e:
            return error_response(e)
    return success_response(response, 400 if bad_request else 200)
