from sqlalchemy import Column, Index, Integer
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class AggregatePlays(Base, RepresentableMixin):
    __tablename__ = "aggregate_plays"

    play_item_id = Column(Integer, primary_key=True, nullable=False, index=True)
    count = Column(Integer, nullable=False, index=False)

    Index("play_item_id_idx", "play_item_id", unique=False)
