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


class SaveType(str, enum.Enum):
    track = "track"
    playlist = "playlist"
    album = "album"


class Save(Base):
    __tablename__ = "saves"

    blockhash = Column(String, ForeignKey("blocks.blockhash"), nullable=True)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=True)
    slot = Column(Integer, nullable=True)
    txhash = Column(String, default="", nullable=False)
    user_id = Column(Integer, nullable=False)
    save_item_id = Column(Integer, nullable=False)
    save_type = Column(Enum(SaveType), nullable=False)
    created_at = Column(DateTime, nullable=False)
    is_current = Column(Boolean, nullable=False)
    is_delete = Column(Boolean, nullable=False)

    PrimaryKeyConstraint(is_current, user_id, save_item_id, save_type, txhash)

    def __repr__(self):
        return f"<Save(blockhash={self.blockhash},\
blocknumber={self.blocknumber},\
txhash={self.txhash},\
slot={self.slot},\
user_id={self.user_id},\
save_item_id={self.save_item_id},\
created_at={self.created_at},\
save_type={self.save_type},\
is_current={self.is_current},\
is_delete={self.is_delete})>"
