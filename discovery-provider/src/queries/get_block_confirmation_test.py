from src.models import Block
from src.queries.get_block_confirmation import get_block_confirmation


def test_get_block_confirmation(web3_mock, redis_mock, db_mock):
    """Tests confirmation of block given a blockhash and a blocknumber"""

    # Set up db state
    blockhash, blocknumber = '0x01', 1
    latest_blockhash, latest_blocknumber = '0x02', 2
    with db_mock.scoped_session() as session:
        Block.__table__.create(db_mock._engine)
        session.add(Block(
            blockhash='0x00',
            number=0,
            parenthash=None,
            is_current=False,
        ))
        session.add(Block(
            blockhash=blockhash,
            number=blocknumber,
            parenthash='0x00',
            is_current=False,
        ))
        session.add(Block(
            blockhash=latest_blockhash,
            number=latest_blocknumber,
            parenthash=blockhash,
            is_current=True,
        ))

    block_confirmation = get_block_confirmation(blockhash, blocknumber)
    assert block_confirmation['block_found'] == True
    assert block_confirmation['block_passed'] == True

    latest_block_confirmation = get_block_confirmation(latest_blockhash, latest_blocknumber)
    assert latest_block_confirmation['block_found'] == True
    assert latest_block_confirmation['block_passed'] == True

    new_block_confirmation = get_block_confirmation('0xfe', 2)
    assert new_block_confirmation['block_found'] == False
    assert new_block_confirmation['block_passed'] == True

    new_block_confirmation = get_block_confirmation('0xff', 3)
    assert new_block_confirmation['block_found'] == False
    assert new_block_confirmation['block_passed'] == False
