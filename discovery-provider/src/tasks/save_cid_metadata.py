from typing import Dict

from sqlalchemy.orm.session import Session
from src.models.indexing.cid_data import CIDData


def save_cid_metadata(
    session: Session, cid_metadata: Dict[str, Dict], cid_type: Dict[str, str]
):
    if not cid_metadata:
        return

    for cid, val in cid_metadata.items():
        cid_data = CIDData(cid=cid, type=cid_type[cid], data=val)
        session.merge(cid_data)
