from sqlalchemy import desc

from src.models.indexing.core_indexed_block import CoreIndexedBlock
from src.utils import db_session, helpers


# returns a dictionary that represents whether
# the given blockhash is present, the given blocknumber is passed
def get_block_confirmation(blockhash, blocknumber):
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        blockhash_query = (
            session.query(CoreIndexedBlock)
            .filter(CoreIndexedBlock.blockhash == blockhash)
            .all()
        )

        latest_block_query = (
            session.query(CoreIndexedBlock)
            .order_by(desc(CoreIndexedBlock.height))
            .first()
        )

        if latest_block_query is None:
            raise Exception("Expected SINGLE row marked as current")

        latest_block_record = helpers.model_to_dictionary(latest_block_query)
        latest_block_number = latest_block_record["height"] or 0

        return {
            "block_found": len(blockhash_query) > 0,
            "block_passed": latest_block_number >= blocknumber,
        }
