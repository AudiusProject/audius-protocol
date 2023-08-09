import enum

from sqlalchemy import Column, DateTime, Enum, Integer, String, text

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class SkippedTransactionLevel(str, enum.Enum):
    node = "node"
    network = "network"


class SkippedTransaction(Base, RepresentableMixin):
    __tablename__ = "skipped_transactions"

    id = Column(
        Integer,
        primary_key=True,
    )
    blocknumber = Column(Integer, nullable=False)
    blockhash = Column(String, nullable=False)
    txhash = Column(String, nullable=False)
    created_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    level = Column(
        Enum("node", "network", name="skippedtransactionlevel"),
        nullable=False,
        server_default=text("'node'::skippedtransactionlevel"),
    )
