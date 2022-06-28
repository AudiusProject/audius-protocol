import enum

from sqlalchemy import Column, DateTime, Enum, Integer, String, func
from src.models.base import Base


class SkippedTransactionLevel(str, enum.Enum):
    node = "node"
    network = "network"


class SkippedTransaction(Base):
    __tablename__ = "skipped_transactions"

    id = Column(Integer, primary_key=True, nullable=False)
    blocknumber = Column(Integer, nullable=False)
    blockhash = Column(String, nullable=False)
    txhash = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )
    level = Column(
        Enum(SkippedTransactionLevel),
        nullable=False,
        default=SkippedTransactionLevel.node,
    )

    def __repr__(self):
        return f"<SkippedTransaction(\
id={self.id},\
blocknumber={self.blocknumber},\
blockhash={self.blockhash},\
txhash={self.txhash},\
level={self.level},\
created_at={self.created_at},\
updated_at={self.updated_at})>"
