import logging
from flask import Blueprint, request
from src.queries.get_skipped_transactions import (
    get_skipped_transactions,
    get_transaction_status,
)
from src.api_helpers import error_response, success_response

logger = logging.getLogger(__name__)

bp = Blueprint("indexing", __name__)


@bp.route("/indexing/skipped_transactions", methods=["GET"])
def check_skipped_transactions():
    """
    Returns skipped transactions during indexing
    Takes query params 'blocknumber', 'blockhash', and 'transactionhash'
    Filters by query params if they are not null
    """
    blocknumber = request.args.get("blocknumber", type=int)
    blockhash = request.args.get("blockhash")
    transactionhash = request.args.get("transactionhash")
    skipped_transactions = get_skipped_transactions(
        blocknumber, blockhash, transactionhash
    )
    return success_response(skipped_transactions)


@bp.route("/indexing/transaction_status", methods=["GET"])
def check_transaction_status():
    """
    Returns whether a transaction 'PASSED' | 'FAILED' | 'NOT_FOUND'
    based on all 3 query params 'blocknumber', 'blockhash', and 'transactionhash'
    """
    blocknumber = request.args.get("blocknumber", type=int)
    blockhash = request.args.get("blockhash")
    transactionhash = request.args.get("transactionhash")
    if blocknumber is None or blockhash is None or transactionhash is None:
        return error_response(
            f"Please pass in required query parameters 'blocknumber', 'blockhash', and 'transactionhash'",
            400,
        )
    try:
        transaction_status = get_transaction_status(
            blocknumber, blockhash, transactionhash
        )
    except Exception as e:
        return error_response(e)
    return success_response(transaction_status)
