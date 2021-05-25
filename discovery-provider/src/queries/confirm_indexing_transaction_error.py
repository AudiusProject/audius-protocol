import logging
import requests
from src.tasks.index_metrics import get_all_other_nodes

logger = logging.getLogger(__name__)

'''
Confirms that a transaction is causing an error indexing across the discovery nodes
Gets all other discovery nodes and makes an api call to check the status of a transaction
given a blocknumber, blockhash, and transactionhash
'''
def confirm_indexing_transaction_error(blocknumber, blockhash, transactionhash):
    all_other_nodes = get_all_other_nodes()
    num_other_nodes = len(all_other_nodes)
    num_transaction_failures = 0
    for node in all_other_nodes:
        try:
            endpoint = "{}/indexing/transaction_status?blocknumber={}&blockhash={}&transactionhash={}".format(
                node, blocknumber, blockhash, transactionhash
            )
            response = requests.get(endpoint, timeout=10)
            if response.status_code != 200:
                raise Exception(f"Query to indexing transaction status endpoint {endpoint} \
                    failed with status code {response.status_code}")
            if response.json()['data'] == 'FAILED':
                num_transaction_failures += 1
        except Exception as e:
            logger.error(e)
    return {'num_failed': num_transaction_failures, 'total': num_other_nodes}
