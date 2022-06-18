def sort_block_transactions(block, indexing_transaction_index_sort_order_start_block):
    # Sort transactions by transactionIndex after we have hit
    # indexing_transaction_index_sort_order_start_block.
    if block.number > indexing_transaction_index_sort_order_start_block:
        sorted_txs = sorted(
            block.transactions,
            key=lambda entry: entry["transactionIndex"],
        )
    else:
        sorted_txs = sorted(block.transactions, key=lambda entry: entry["hash"])
    return sorted_txs
