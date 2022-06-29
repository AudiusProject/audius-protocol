from src.tasks.sort_block_transactions import sort_block_transactions


def makeTestTransaction(hash, transactionIndex):
    return {"hash": hash, "transactionIndex": transactionIndex}


class TestBlock:
    def __init__(self, number, transactions):
        self.number = number
        self.transactions = transactions


def test_sort_by_hash():
    block = TestBlock(
        100,
        [
            {"hash": "0xaaa", "transactionIndex": 1},
            {"hash": "0xddd", "transactionIndex": 2},
            {"hash": "0xccc", "transactionIndex": 3},
            {"hash": "0xbbb", "transactionIndex": 4},
        ],
    )
    sorted_txs = sort_block_transactions(block, 200)
    assert sorted_txs == [
        {"hash": "0xaaa", "transactionIndex": 1},
        {"hash": "0xbbb", "transactionIndex": 4},
        {"hash": "0xccc", "transactionIndex": 3},
        {"hash": "0xddd", "transactionIndex": 2},
    ]


def test_sort_by_transaction_index():
    block = TestBlock(
        100,
        [
            {"hash": "0xaaa", "transactionIndex": 1},
            {"hash": "0xddd", "transactionIndex": 3},
            {"hash": "0xccc", "transactionIndex": 2},
            {"hash": "0xbbb", "transactionIndex": 4},
        ],
    )
    sorted_txs = sort_block_transactions(block, 50)
    assert sorted_txs == [
        {"hash": "0xaaa", "transactionIndex": 1},
        {"hash": "0xccc", "transactionIndex": 2},
        {"hash": "0xddd", "transactionIndex": 3},
        {"hash": "0xbbb", "transactionIndex": 4},
    ]
