import json
from typing import Dict

from sqlalchemy.orm.session import Session


def save_cid_metadata(
    session: Session, cid_metadata: Dict[str, Dict], cid_type: Dict[str, str]
):
    if not cid_metadata:
        return

    vals = []
    for cid, val in cid_metadata.items():
        vals.append({"cid": cid, "type": cid_type[cid], "data": json.dumps(val)})

    session.execute(
        """
            INSERT INTO cid_data (cid, type, data)
            VALUES (:cid, :type, :data)
            ON CONFLICT DO NOTHING;
        """,
        vals,
    )
