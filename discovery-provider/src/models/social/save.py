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
from src.models.model_utils import RepresentableMixin


class SaveType(str, enum.Enum):
    track = "track"
    playlist = "playlist"
    album = "album"


class Save(Base, RepresentableMixin):
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
