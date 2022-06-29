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


class RepostType(str, enum.Enum):
    track = "track"
    playlist = "playlist"
    album = "album"


class Repost(Base, RepresentableMixin):
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
