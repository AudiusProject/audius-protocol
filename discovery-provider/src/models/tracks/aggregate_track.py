from sqlalchemy import Column, Integer, text

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class AggregateTrack(Base, RepresentableMixin):
    __tablename__ = "aggregate_track"

    track_id = Column(Integer, primary_key=True)
    repost_count = Column(Integer, nullable=False, server_default=text("0"))
    save_count = Column(Integer, nullable=False, server_default=text("0"))
