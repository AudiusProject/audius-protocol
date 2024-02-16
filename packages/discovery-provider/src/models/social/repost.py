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
    Text,
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

    blockhash = Column(Text, nullable=False)
    blocknumber = Column(
        Integer, ForeignKey("blocks.number"), index=True, nullable=False
    )
    user_id = Column(Integer, primary_key=True, nullable=False)
    repost_item_id = Column(Integer, primary_key=True, nullable=False)
    repost_type = Column(
        Enum(RepostType),
        primary_key=True,
        nullable=False,
    )
    is_current = Column(Boolean, primary_key=True, nullable=False)
    is_delete = Column(Boolean, nullable=False)

    # Column denotes whether the repost object is a repost of a repost,
    # which is used to notify the initial reposter that a follower reposted
    # their reposted content.
    is_repost_of_repost = Column(Boolean, nullable=False, server_default="false")
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
