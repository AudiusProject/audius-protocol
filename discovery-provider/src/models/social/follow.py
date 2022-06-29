from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    PrimaryKeyConstraint,
    String,
)
from src.models.base import Base


class Follow(Base):
    __tablename__ = "follows"

    blockhash = Column(String, ForeignKey("blocks.blockhash"), nullable=True)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=True)
    slot = Column(Integer, nullable=True)
    txhash = Column(String, default="", nullable=False)
    follower_user_id = Column(Integer, nullable=False, index=True)
    followee_user_id = Column(Integer, nullable=False, index=True)
    is_current = Column(Boolean, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    created_at = Column(DateTime, nullable=False)

    PrimaryKeyConstraint(
        is_current, follower_user_id, followee_user_id, txhash, created_at
    )

    def __repr__(self):
        return f"<Follow(blockhash={self.blockhash},\
blocknumber={self.blocknumber},\
txhash={self.txhash},\
slot={self.slot},\
follower_user_id={self.follower_user_id},\
followee_user_id={self.followee_user_id},\
is_current={self.is_current},\
is_delete={self.is_delete},\
created_at={self.created_at})>"
