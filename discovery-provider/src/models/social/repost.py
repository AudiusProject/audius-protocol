import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    text,
)
from sqlalchemy.orm import relationship
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class RepostType(str, enum.Enum):
    track = "track"
    playlist = "playlist"
    album = "album"


class Repost(Base, RepresentableMixin):
    __tablename__ = "reposts"
    __table_args__ = (
        Index("repost_item_id_idx", "repost_item_id", "repost_type"),
        Index("repost_user_id_idx", "user_id", "repost_type"),
    )

    blockhash = Column(ForeignKey("blocks.blockhash"))  # type: ignore
    blocknumber = Column(ForeignKey("blocks.number"), index=True)  # type: ignore
    user_id = Column(Integer, primary_key=True, nullable=False)
    repost_item_id = Column(Integer, primary_key=True, nullable=False)
    repost_type = Column(
        Enum(RepostType),
        primary_key=True,
        nullable=False,
    )
    is_current = Column(Boolean, primary_key=True, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    created_at = Column(DateTime, nullable=False, index=True)
    txhash = Column(
        String,
        primary_key=True,
        nullable=False,
        server_default=text("''::character varying"),
    )
    slot = Column(Integer)

    block = relationship(  # type: ignore
        "Block", primaryjoin="Repost.blockhash == Block.blockhash"
    )
    block1 = relationship(  # type: ignore
        "Block", primaryjoin="Repost.blocknumber == Block.number"
    )
