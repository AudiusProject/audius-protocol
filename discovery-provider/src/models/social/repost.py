import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    PrimaryKeyConstraint,
    String,
)
from src.models.base import Base


class RepostType(str, enum.Enum):
    track = "track"
    playlist = "playlist"
    album = "album"


class Repost(Base):
    __tablename__ = "reposts"

    blockhash = Column(String, ForeignKey("blocks.blockhash"), nullable=True)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=True)
    slot = Column(Integer, nullable=True)
    txhash = Column(String, default="", nullable=False)
    user_id = Column(Integer, nullable=False)
    repost_item_id = Column(Integer, nullable=False)
    repost_type = Column(Enum(RepostType), nullable=False)
    is_current = Column(Boolean, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    created_at = Column(DateTime, nullable=False)

    PrimaryKeyConstraint(user_id, repost_item_id, repost_type, is_current, txhash)

    def __repr__(self):
        return f"<Repost(blockhash={self.blockhash},\
blocknumber={self.blocknumber},\
txhash={self.txhash},\
slot={self.slot},\
user_id={self.user_id},\
repost_item_id={self.repost_item_id},\
repost_type={self.repost_type},\
is_current={self.is_current},\
is_delete={self.is_delete},\
created_at={self.created_at})>"
