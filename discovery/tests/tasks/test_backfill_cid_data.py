import logging  # pylint: disable=C0302
from unittest.mock import patch

from sqlalchemy import desc
from web3.datastructures import AttributeDict

from src.models.indexing.cid_data import CIDData
from src.tasks.backfill_cid_data import backfill_cid_data
from src.utils import redis_connection
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)

csv = """cid_1\tuser\t"{""user_id"": 1}"
cid_2\tuser\t"{""user_id"": 2}"
cid_3\ttrack\t"{""name"": ""ray""}"
"""


@patch(
    "src.tasks.backfill_cid_data.requests.get",
    return_value=AttributeDict({"iter_content": lambda _: [bytes(csv, "utf-8")]}),
)
def test_backfill_cid_data(request_get, app, mocker):
    """Happy path test: test that we get all valid listens from prior year"""
    # setup
    with app.app_context():
        db = get_db()

    mocker.patch(
        "os.getenv",
        return_value="stage",
    )

    backfill_cid_data(db)
    with db.scoped_session() as session:
        users = (
            session.query(CIDData)
            .filter(CIDData.type == "user")
            .order_by(desc(CIDData.cid))
            .all()
        )
        assert len(users) == 2
        assert users[0].data == {"user_id": 2}
        assert users[1].data == {"user_id": 1}
        assert (
            redis_connection.get_redis().get("backfilled_cid_data").decode() == "true"
        )
