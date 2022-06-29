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
from src.models.model_utils import RepresentableMixin


class Follow(Base, RepresentableMixin):
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
