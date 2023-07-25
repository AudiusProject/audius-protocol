from sqlalchemy import BigInteger, Column, Integer

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class AggregatePlay(Base, RepresentableMixin):
    __tablename__ = "aggregate_plays"

    play_item_id = Column(Integer, primary_key=True)
    count = Column(BigInteger)
