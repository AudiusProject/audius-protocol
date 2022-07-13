from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, validates
from src.model_validator import ModelValidator
from src.models.base import Base
from src.models.model_utils import RepresentableMixin, validate_field_helper


class Playlist(Base, RepresentableMixin):
    __tablename__ = "playlists"

    blockhash = Column(ForeignKey("blocks.blockhash"))  # type: ignore
    blocknumber = Column(ForeignKey("blocks.number"), index=True)  # type: ignore
    playlist_id = Column(Integer, primary_key=True, nullable=False)
    playlist_owner_id = Column(Integer, nullable=False, index=True)
    is_album = Column(Boolean, nullable=False)
    is_private = Column(Boolean, nullable=False)
    playlist_name = Column(String)
    playlist_contents = Column(JSONB(), nullable=False)
    playlist_image_multihash = Column(String)
    is_current = Column(Boolean, primary_key=True, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, nullable=False, index=True)
    upc = Column(String)
    updated_at = Column(DateTime, nullable=False)
    playlist_image_sizes_multihash = Column(String)
    txhash = Column(
        String,
        primary_key=True,
        nullable=False,
        server_default=text("''::character varying"),
    )
    last_added_to = Column(DateTime)
    slot = Column(Integer)

    block = relationship(  # type: ignore
        "Block", primaryjoin="Playlist.blockhash == Block.blockhash"
    )
    block1 = relationship(  # type: ignore
        "Block", primaryjoin="Playlist.blocknumber == Block.number"
    )

    ModelValidator.init_model_schemas("Playlist")
    fields = ["playlist_name", "description"]

    # unpacking args into @validates
    @validates(*fields)
    def validate_field(self, field, value):
        return validate_field_helper(
            field, value, "Playlist", getattr(Playlist, field).type
        )
