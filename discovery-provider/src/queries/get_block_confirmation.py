from src.models import Block
from src.utils import helpers, db_session

# returns a dictionary that represents whether
# the given blockhash is present, the given blocknumber is passed
def get_block_confirmation(blockhash, blocknumber):
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        blockhash_query = (
            session.query(Block).filter(Block.blockhash == blockhash).all()
        )

        latest_block_query = session.query(Block).filter(Block.is_current == True).all()

        if len(latest_block_query) != 1:
            raise Exception("Expected SINGLE row marked as current")

        latest_block_record = helpers.model_to_dictionary(latest_block_query[0])
        latest_block_number = latest_block_record["number"] or 0

        return {
            "block_found": len(blockhash_query) > 0,
            "block_passed": latest_block_number >= blocknumber,
        }
