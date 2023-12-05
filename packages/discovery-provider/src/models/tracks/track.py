from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    PrimaryKeyConstraint,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, validates

from src.model_validator import ModelValidator
from src.models.base import Base
from src.models.model_utils import (
    RepresentableMixin,
    get_fields_to_validate,
    validate_field_helper,
)
from src.models.tracks.track_route import TrackRoute
from src.models.users.user import User


class Track(Base, RepresentableMixin):
    __tablename__ = "tracks"

    blockhash = Column(Text, ForeignKey("blocks.blockhash"), nullable=False)
    blocknumber = Column(
        Integer, ForeignKey("blocks.number"), index=True, nullable=False
    )
    track_id = Column(Integer, primary_key=True, nullable=False)
    is_current = Column(Boolean, primary_key=True, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    owner_id = Column(Integer, nullable=False, index=True)
    audio_upload_id = Column(String)
    preview_cid = Column(String, index=True)
    track_cid = Column(
        String, index=True
    )  # todo: after backfill, add nullable=False, both here and in a db migration
    orig_file_cid = Column(
        String, index=True
    )  # todo: after backfill, add nullable=False, both here and in a db migration
    orig_filename = Column(Text)
    title = Column(Text)
    duration = Column(Integer)
    preview_start_seconds = Column(Float)
    cover_art = Column(String)
    tags = Column(String)
    genre = Column(String)
    mood = Column(String)
    credits_splits = Column(String)
    create_date = Column(String)
    release_date = Column(DateTime)
    file_type = Column(String)
    metadata_multihash = Column(String)
    track_segments = Column(JSONB(), nullable=False)
    created_at = Column(DateTime, nullable=False, index=True)
    description = Column(String)
    isrc = Column(String)
    iswc = Column(String)
    license = Column(String)
    updated_at = Column(DateTime, nullable=False)
    cover_art_sizes = Column(String)
    download = Column(JSONB())
    is_scheduled_release = Column(Boolean, nullable=False, server_default=text("false"))
    is_unlisted = Column(Boolean, nullable=False, server_default=text("false"))
    field_visibility = Column(JSONB(True))
    route_id = Column(String)
    stem_of = Column(JSONB(True))
    remix_of = Column(JSONB(True))
    txhash = Column(
        String,
        primary_key=True,
        nullable=False,
        server_default=text("''::character varying"),
    )
    slot = Column(Integer)
    is_available = Column(Boolean, nullable=False, server_default=text("true"))
    is_premium = Column(Boolean, nullable=False, server_default=text("false"))
    premium_conditions = Column(JSONB(True))
    is_download_gated = Column(Boolean, nullable=False, server_default=text("false"))
    download_conditions = Column(JSONB(True))
    is_playlist_upload = Column(Boolean, nullable=False, server_default=text("false"))
    ai_attribution_user_id = Column(Integer, nullable=True)

    block = relationship(  # type: ignore
        "Block", primaryjoin="Track.blockhash == Block.blockhash"
    )
    block1 = relationship(  # type: ignore
        "Block", primaryjoin="Track.blocknumber == Block.number"
    )

    _routes = relationship(  # type: ignore
        TrackRoute,
        primaryjoin="and_(\
            remote(Track.track_id) == foreign(TrackRoute.track_id),\
            TrackRoute.is_current)",
        lazy="joined",
        viewonly=True,
    )

    user = relationship(  # type: ignore
        User,
        primaryjoin="and_(\
            remote(Track.owner_id) == foreign(User.user_id),\
            User.is_current)",
        lazy="joined",
        viewonly=True,
    )

    @property
    def _slug(self):
        return self._routes[0].slug if self._routes else ""

    @property
    def permalink(self):
        if self.user and self.user[0].handle and self._slug:
            return f"/{self.user[0].handle}/{self._slug}"
        return ""

    PrimaryKeyConstraint(is_current, track_id, txhash)

    ModelValidator.init_model_schemas("Track")
    fields = get_fields_to_validate("Track")

    # unpacking args into @validates
    @validates(*fields)
    def validate_field(self, field, value):
        return validate_field_helper(field, value, "Track", getattr(Track, field).type)

    def get_attributes_dict(self):
        return {col.name: getattr(self, col.name) for col in self.__table__.columns}
