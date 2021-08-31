from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    PrimaryKeyConstraint,
)
from sqlalchemy.sql.sqltypes import Unicode
from .models import Base


class TrackRoute(Base):
    __tablename__ = "track_routes"

    # Actual URL slug for the track, includes collision_id
    slug = Column(Unicode, nullable=False)
    # Just the title piece of the slug for the track, excludes collision_id
    # Used for finding max collision_id needed for duplicate title_slugs
    title_slug = Column(Unicode, nullable=False)
    collision_id = Column(Integer, nullable=False)
    owner_id = Column(Integer, nullable=False)
    track_id = Column(Integer, nullable=False)
    is_current = Column(Boolean, nullable=False)
    blockhash = Column(String, nullable=False)
    blocknumber = Column(Integer, nullable=False)
    txhash = Column(String, nullable=False)

    PrimaryKeyConstraint(owner_id, slug)

    def __repr__(self):
        return f"<TrackRoute(\
slug={self.slug},\
title_slug={self.title_slug},\
collision_id={self.collision_id},\
owner_id={self.owner_id},\
track_id={self.track_id},\
is_current={self.is_current},\
blockhash={self.blockhash},\
blocknumber={self.blocknumber},\
txhash={self.txhash})>"
