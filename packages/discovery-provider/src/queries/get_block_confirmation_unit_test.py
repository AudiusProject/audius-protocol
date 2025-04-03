from src.models.core.core_indexed_blocks import CoreIndexedBlocks
from src.queries.get_block_confirmation import get_block_confirmation
from src.tasks.core.gen.protocol_pb2 import BlockResponse, NodeInfoResponse


class MockCore:
    def __init__(self, return_block: BlockResponse):
        self.return_block = return_block

    def get_node_info(self) -> NodeInfoResponse:
        return NodeInfoResponse(chainid="audius-devnet")

    def get_block(self, *args) -> BlockResponse:
        return self.return_block


def test_get_block_confirmation(redis_mock, db_mock):
    """Tests confirmation of block given a blockhash and a blocknumber"""

    core = MockCore(BlockResponse())

    # Set up db state
    blockhash, blocknumber = "0x01", 1
    latest_blockhash, latest_blocknumber = "0x02", 2
    with db_mock.scoped_session() as session:
        # Create the core_indexed_blocks table in the test database
        CoreIndexedBlocks.__table__.create(db_mock._engine)

        session.add(
            CoreIndexedBlocks(
                blockhash="0x00",
                height=0,
                parenthash=None,
                chain_id="1",
            )
        )
        session.add(
            CoreIndexedBlocks(
                blockhash=blockhash,
                height=blocknumber,
                parenthash="0x00",
                chain_id="1",
            )
        )
        session.add(
            CoreIndexedBlocks(
                blockhash=latest_blockhash,
                height=latest_blocknumber,
                parenthash=blockhash,
                chain_id="1",
            )
        )

    block_confirmation = get_block_confirmation(blockhash, blocknumber, core)
    assert block_confirmation["block_found"] == True
    assert block_confirmation["block_passed"] == True

    latest_block_confirmation = get_block_confirmation(
        latest_blockhash, latest_blocknumber, core
    )
    assert latest_block_confirmation["block_found"] == True
    assert latest_block_confirmation["block_passed"] == True

    new_block_confirmation = get_block_confirmation("0xfe", 2, core)
    assert new_block_confirmation["block_found"] == False
    assert new_block_confirmation["block_passed"] == True

    new_block_confirmation = get_block_confirmation("0xff", 3, core)
    assert new_block_confirmation["block_found"] == False
    assert new_block_confirmation["block_passed"] == False
