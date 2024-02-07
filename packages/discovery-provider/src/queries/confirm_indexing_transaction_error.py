import logging

import requests

from src.queries.get_skipped_transactions import set_indexing_error
from src.utils.config import shared_config
from src.utils.get_all_nodes import get_all_discovery_nodes_cached

logger = logging.getLogger(__name__)

# Percent of total discovery nodes needed to skip indexing a transaction
INDEXING_FAILURE_CONSENSUS_PERCENT = 0.8


def confirm_indexing_transaction_error(
    redis, blocknumber, blockhash, transactionhash, message
):
    """
    Confirms that a transaction is causing an error indexing across the discovery nodes
    Gets all other discovery nodes and makes an api call to check the status of a transaction
    given a blocknumber, blockhash, and transactionhash
    """
    all_nodes = get_all_discovery_nodes_cached(redis) or []
    if not all_nodes:
        return False

    num_other_nodes = len(all_nodes) - 1
    num_transaction_failures = 0
    for node in all_nodes:
        # Skip self
        if node["delegateOwnerWallet"] == shared_config["delegate"]["owner_wallet"]:
            continue
        try:
            endpoint = f"{node['endpoint']}/indexing/transaction_status?blocknumber={blocknumber}&blockhash={blockhash}&transactionhash={transactionhash}"
            response = requests.get(endpoint, timeout=10)
            if response.status_code != 200:
                raise Exception(
                    f"Query to indexing transaction status endpoint {endpoint} \
                    failed with status code {response.status_code}"
                )
            if response.json()["data"] == "FAILED":
                num_transaction_failures += 1
        except Exception as e:
            logger.error(e)

    # Mark the redis indexing error w/ has_consensus = true so that it skips this transaction
    if (
        num_other_nodes >= 1
        and num_transaction_failures
        >= num_other_nodes * INDEXING_FAILURE_CONSENSUS_PERCENT
    ):
        set_indexing_error(
            redis, blocknumber, blockhash, transactionhash, message, True
        )
        return True
    return False
