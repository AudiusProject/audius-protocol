from sqlalchemy import Column, Integer
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class Remix(Base, RepresentableMixin):
    __tablename__ = "remixes"

    parent_track_id = Column(Integer, primary_key=True, nullable=False)
    child_track_id = Column(Integer, primary_key=True, nullable=False)
