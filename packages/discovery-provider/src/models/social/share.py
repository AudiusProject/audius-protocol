import enum

from sqlalchemy import Column, DateTime, Enum, Index, Integer, String, Text, text

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class ShareType(str, enum.Enum):
    track = "track"
    playlist = "playlist"


class Share(Base, RepresentableMixin):
    __tablename__ = "shares"
    __table_args__ = (
        Index("shares_item_idx", "share_item_id", "share_type", "user_id"),
        Index("shares_new_blocknumber_idx", "blocknumber"),
        Index("shares_new_created_at_idx", "created_at"),
        Index(
            "shares_user_idx", "user_id", "share_type", "share_item_id", "created_at"
        ),
        Index("shares_slot_idx", "slot"),
    )

    blockhash = Column(Text, nullable=True)
    blocknumber = Column(
        Integer,
        index=True,
        nullable=True,
    )
    user_id = Column(Integer, primary_key=True, nullable=False)
    share_item_id = Column(Integer, primary_key=True, nullable=False)
    share_type = Column(
        Enum(ShareType),
        primary_key=True,
        nullable=False,
    )
    created_at = Column(
        DateTime, nullable=False, index=True, server_default=text("CURRENT_TIMESTAMP")
    )
    txhash = Column(
        String,
        primary_key=True,
        nullable=False,
        server_default=text("''::character varying"),
    )
    slot = Column(Integer, nullable=True)
