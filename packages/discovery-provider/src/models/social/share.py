import enum

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    text,
)

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class ShareType(str, enum.Enum):
    track = "track"
    playlist = "playlist"


class Share(Base, RepresentableMixin):
    __tablename__ = "shares"
    __table_args__ = (
        Index("shares_item_id_idx", "share_item_id", "share_type"),
        Index("shares_user_id_idx", "user_id", "share_type"),
        Index("shares_blocknumber_idx", "blocknumber"),
        Index("shares_created_at_idx", "created_at"),
        Index("shares_slot_idx", "slot"),
    )

    blockhash = Column(Text, nullable=True)
    blocknumber = Column(
        Integer, ForeignKey("blocks.number"), index=True, nullable=True
    )
    user_id = Column(Integer, nullable=False)
    share_item_id = Column(Integer, nullable=False)
    share_type = Column(
        Enum(ShareType),
        nullable=False,
    )
    created_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    txhash = Column(
        String,
        nullable=False,
        server_default=text("''::character varying"),
    )
    slot = Column(Integer, nullable=True)
