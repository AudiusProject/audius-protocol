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


class SaveType(str, enum.Enum):
    track = "track"
    playlist = "playlist"
    album = "album"


class Save(Base, RepresentableMixin):
    __tablename__ = "saves"
    __table_args__ = (
        Index("save_item_id_idx", "save_item_id", "save_type"),
        Index("save_user_id_idx", "user_id", "save_type"),
    )

    blockhash = Column(Text, nullable=False)
    blocknumber = Column(
        Integer, ForeignKey("blocks.number"), index=True, nullable=False
    )
    user_id = Column(Integer, primary_key=True, nullable=False)
    save_item_id = Column(Integer, primary_key=True, nullable=False)
    save_type = Column(
        Enum(SaveType),
        primary_key=True,
        nullable=False,
    )

    is_save_of_repost = Column(Boolean, nullable=False, server_default="false")

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

    block1 = relationship(  # type: ignore
        "Block", primaryjoin="Save.blocknumber == Block.number"
    )
