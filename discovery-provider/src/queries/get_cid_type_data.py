import logging

from src import exceptions
from src.models.indexing.cid_data import CIDData
from src.utils import db_session

logger = logging.getLogger(__name__)


def get_cid_type_data(cid: str):
    """
    Returns the Type and JSON metadata associated with the CID
    Args: the observed CID
    """
    if cid is None:
        raise exceptions.ArgumentError("Input CID is invalid")

    # Attempt to acquire lock - do not block if unable to acquire
    type = None
    data = None
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        cid_metata = session.query(CIDData).filter(CIDData.cid == cid).first()
        if cid_metata:
            type = cid_metata.type
            data = cid_metata.data
    return type, data
