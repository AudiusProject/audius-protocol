from sqlalchemy import Column, Integer
from .models import Base


class AggregateIntervalPlay(Base):
    """
    Aggregate Interval Play aggregates the plays by time interval
    """

    __tablename__ = "aggregate_interval_plays"

    track_id = Column(Integer, nullable=False, primary_key=True)
    genre = Column(Integer, nullable=False)
    created_at = Column(Integer, nullable=False)
    week_listen_counts = Column(Integer, nullable=False)
    month_listen_counts = Column(Integer, nullable=False)
    year_listen_counts = Column(Integer, nullable=False)

    def __repr__(self):
        return f"<AggregateIntervalPlay(\
track_id={self.track_id},\
genre={self.genre},\
created_at={self.created_at},\
week_listen_counts={self.week_listen_counts},\
month_listen_counts={self.month_listen_counts},\
year_listen_counts={self.year_listen_counts},\
)>"
