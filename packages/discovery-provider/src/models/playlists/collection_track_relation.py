from sqlalchemy import Boolean, Column, DateTime, Integer, text

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class CollectionTrackRelation(Base, RepresentableMixin):
    __tablename__ = "collection_track_relations"

    collection_id = Column(Integer, nullable=False, primary_key=True, index=True)
    track_id = Column(Integer, nullable=False, primary_key=True, index=True)
    is_removed = Column(Boolean, nullable=False)
    created_at = Column(
        DateTime, nullable=False, index=False, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at = Column(
        DateTime, nullable=False, index=False, server_default=text("CURRENT_TIMESTAMP")
    )
