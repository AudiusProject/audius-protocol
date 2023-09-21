from src.tasks.sort_block_transactions import sort_block_transactions


def makeTestTransaction(hash, transactionIndex):
    return {"transactionHash": hash, "transactionIndex": transactionIndex}


def makeTestBlock(number):
    return {"number": number}


def test_sort_by_hash():
    txs = [
        {"transactionHash": "0xaaa", "transactionIndex": 1},
        {"transactionHash": "0xddd", "transactionIndex": 2},
        {"transactionHash": "0xccc", "transactionIndex": 3},
        {"transactionHash": "0xbbb", "transactionIndex": 4},
    ]
    block = makeTestBlock(100)
    sorted_txs = sort_block_transactions(block, txs, 200)
    assert sorted_txs == [
        {"transactionHash": "0xaaa", "transactionIndex": 1},
        {"transactionHash": "0xbbb", "transactionIndex": 4},
        {"transactionHash": "0xccc", "transactionIndex": 3},
        {"transactionHash": "0xddd", "transactionIndex": 2},
    ]


def test_sort_by_transaction_index():
    txs = [
        {"transactionHash": "0xaaa", "transactionIndex": 1},
        {"transactionHash": "0xddd", "transactionIndex": 3},
        {"transactionHash": "0xccc", "transactionIndex": 2},
        {"transactionHash": "0xbbb", "transactionIndex": 4},
    ]
    block = makeTestBlock(100)
    sorted_txs = sort_block_transactions(block, txs, 50)
    assert sorted_txs == [
        {"transactionHash": "0xaaa", "transactionIndex": 1},
        {"transactionHash": "0xccc", "transactionIndex": 2},
        {"transactionHash": "0xddd", "transactionIndex": 3},
        {"transactionHash": "0xbbb", "transactionIndex": 4},
    ]
