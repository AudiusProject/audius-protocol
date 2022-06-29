import datetime

from sqlalchemy import Column, DateTime, Float, Integer, PrimaryKeyConstraint
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class RelatedArtist(Base, RepresentableMixin):
    __tablename__ = "related_artists"

    user_id = Column(Integer, nullable=False, index=True)
    related_artist_user_id = Column(Integer, nullable=False)
    score = Column(Float, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    PrimaryKeyConstraint(user_id, related_artist_user_id)
