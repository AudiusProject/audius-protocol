from sqlalchemy import Column, Index, Integer
from src.models.base import Base


class AggregateTrack(Base):
    __tablename__ = "aggregate_track"

    track_id = Column(Integer, primary_key=True, nullable=False, index=True)
    repost_count = Column(Integer, nullable=False)
    save_count = Column(Integer, nullable=False)

    Index("aggregate_track_idx", "track_id", unique=True)

    def __repr__(self):
        return f"<AggregateTrack(\
track_id={self.track_id},\
repost_count={self.repost_count},\
save_count={self.save_count})>"
