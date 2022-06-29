from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    PrimaryKeyConstraint,
    String,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import validates
from src.model_validator import ModelValidator
from src.models.base import Base
from src.models.model_utils import validate_field_helper


class Playlist(Base):
    __tablename__ = "playlists"
    blockhash = Column(String, ForeignKey("blocks.blockhash"), nullable=True)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=True)
    slot = Column(Integer, nullable=True)
    txhash = Column(String, default="", nullable=False)
    playlist_id = Column(Integer, nullable=False)
    playlist_owner_id = Column(Integer, nullable=False)
    is_album = Column(Boolean, nullable=False)
    is_private = Column(Boolean, nullable=False)
    playlist_name = Column(String)
    playlist_contents = Column(JSONB, nullable=False)
    playlist_image_multihash = Column(String)
    playlist_image_sizes_multihash = Column(String)
    description = Column(String)
    upc = Column(String)
    is_current = Column(Boolean, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    last_added_to = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False)

    PrimaryKeyConstraint(is_current, playlist_id, playlist_owner_id, txhash)

    ModelValidator.init_model_schemas("Playlist")
    fields = ["playlist_name", "description"]

    # unpacking args into @validates
    @validates(*fields)
    def validate_field(self, field, value):
        return validate_field_helper(
            field, value, "Playlist", getattr(Playlist, field).type
        )

    def __repr__(self):
        return f"<Playlist(blockhash={self.blockhash},\
blocknumber={self.blocknumber},\
slot={self.slot},\
txhash={self.txhash},\
playlist_id={self.playlist_id},\
playlist_owner_id={self.playlist_owner_id},\
is_album={self.is_album},\
is_private={self.is_private},\
playlist_name={self.playlist_name},\
playlist_contents={self.playlist_contents},\
playlist_image_multihash={self.playlist_image_multihash},\
playlist_image_sizes_multihash={self.playlist_image_sizes_multihash},\
description={self.description},\
upc={self.upc}\
is_current={self.is_current},\
is_delete={self.is_delete},\
updated_at={self.updated_at},\
created_at={self.created_at})>"
