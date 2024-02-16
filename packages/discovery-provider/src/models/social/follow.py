from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.orm import relationship

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class Follow(Base, RepresentableMixin):
    __tablename__ = "follows"
    __table_args__ = (
        Index(
            "follows_inbound_idx",
            "followee_user_id",
            "follower_user_id",
            "is_current",
            "is_delete",
        ),
    )

    blockhash = Column(Text, nullable=False)
    blocknumber = Column(
        Integer, ForeignKey("blocks.number"), index=True, nullable=False
    )
    follower_user_id = Column(Integer, primary_key=True, nullable=False, index=True)
    followee_user_id = Column(Integer, primary_key=True, nullable=False, index=True)
    is_current = Column(Boolean, primary_key=True, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    created_at = Column(DateTime, nullable=False)
    txhash = Column(
        String,
        primary_key=True,
        nullable=False,
        server_default=text("''::character varying"),
    )
    slot = Column(Integer)

    block = relationship(  # type: ignore
        "Block", primaryjoin="Follow.blockhash == Block.blockhash"
    )
    block1 = relationship(  # type: ignore
        "Block", primaryjoin="Follow.blocknumber == Block.number"
    )
