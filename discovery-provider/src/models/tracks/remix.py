from sqlalchemy import Column, Integer, PrimaryKeyConstraint
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class Remix(Base, RepresentableMixin):
    __tablename__ = "remixes"

    parent_track_id = Column(Integer, nullable=False, index=False)
    child_track_id = Column(Integer, nullable=False, index=False)
    PrimaryKeyConstraint(parent_track_id, child_track_id)
