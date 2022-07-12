from sqlalchemy import Column, Integer, PrimaryKeyConstraint, String
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class TagTrackUserMatview(Base, RepresentableMixin):
    __tablename__ = "tag_track_user"

    tag = Column(String, nullable=False)
    track_id = Column(Integer, nullable=False)
    owner_id = Column(Integer, nullable=False)

    PrimaryKeyConstraint(tag, track_id, owner_id)
