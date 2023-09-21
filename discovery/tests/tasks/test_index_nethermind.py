from datetime import datetime

from web3.datastructures import AttributeDict
from web3.exceptions import BlockNotFound
from web3.types import BlockData

from src.models.indexing.block import Block
from src.tasks.index_nethermind import get_latest_database_block, is_block_on_chain
from src.utils.config import shared_config
from src.utils.db_session import get_db
from tests.utils import populate_mock_db_blocks

REDIS_URL = shared_config["redis"]["url"]

BASE_TIME = datetime(2012, 3, 16, 0, 0)


def test_get_latest_database_block(app):
    with app.app_context():
        db = get_db()
    # Add blocks 1 through 10 and mark 10 as current
    populate_mock_db_blocks(db, 1, 10, is_current=10)
    with db.scoped_session() as session:
        latest_block = get_latest_database_block(session)
        assert latest_block.number == 10
        assert latest_block.blockhash == "0xa"


def test_is_block_on_chain_found(app):
    b = Block(blockhash=hex(1337), number=1337, parenthash="0x01", is_current=True)

    class MockEth:
        def __init__(self, return_block: BlockData):
            self.return_block = return_block

        def get_block(self, *args):
            return self.return_block

    class MockWeb3:
        def __init__(self, return_block):
            self.eth = MockEth(return_block)

    web3_with_block = MockWeb3(AttributeDict({"hash": "0x539", "number": 1337}))
    block_on_chain = is_block_on_chain(web3_with_block, b)
    assert block_on_chain == AttributeDict({"hash": "0x539", "number": 1337})


def test_is_block_on_chain_not_found(app):
    b = Block(blockhash=hex(1337), number=1337, parenthash="0x01", is_current=True)

    class RaisingMockEth:
        def get_block(self, _):
            raise BlockNotFound

    class RaisingMockWeb3:
        def __init__(self):
            self.eth = RaisingMockEth()

    web3_without_block = RaisingMockWeb3()
    block_on_chain = is_block_on_chain(web3_without_block, b)
    assert block_on_chain == False
