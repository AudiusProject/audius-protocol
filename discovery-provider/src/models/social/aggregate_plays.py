from sqlalchemy import Column, Index, Integer
from src.models.base import Base


class AggregatePlays(Base):
    __tablename__ = "aggregate_plays"

    play_item_id = Column(Integer, primary_key=True, nullable=False, index=True)
    count = Column(Integer, nullable=False, index=False)

    Index("play_item_id_idx", "play_item_id", unique=False)

    def __repr__(self):
        return f"<AggregatePlays(\
play_item_id={self.play_item_id},\
count={self.count})>"
