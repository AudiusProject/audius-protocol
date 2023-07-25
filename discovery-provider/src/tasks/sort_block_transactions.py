from typing import List

from web3.types import TxReceipt


def sort_block_transactions(
    block,
    transactions: List[TxReceipt],
    indexing_transaction_index_sort_order_start_block,
):
    # Sort transactions by transactionIndex after we have hit
    # indexing_transaction_index_sort_order_start_block.
    if block.number > indexing_transaction_index_sort_order_start_block:
        sorted_txs = sorted(
            transactions,
            key=lambda entry: entry.get("transactionIndex", 0),
        )
    else:
        sorted_txs = sorted(
            transactions, key=lambda entry: entry.get("transactionHash", "")
        )
    return sorted_txs
