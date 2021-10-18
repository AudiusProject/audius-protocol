from sqlalchemy import Column, Integer, Float, String, DateTime, PrimaryKeyConstraint
from .models import Base


class TrackTrendingScore(Base):
    """
    Trending Scores for tracks
    """

    __tablename__ = "track_trending_scores"

    track_id = Column(Integer, nullable=False, index=True)
    genre = Column(String, nullable=True)
    type = Column(String, nullable=False)
    version = Column(String, nullable=False)
    time_range = Column(String, nullable=False)
    score = Column(Float, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False)

    PrimaryKeyConstraint(track_id, genre, version, time_range)

    def __repr__(self):
        return f"<TrackTrendingScore(\
track_id={self.track_id},\
type={self.type},\
genre={self.genre},\
version={self.version},\
time_range={self.time_range},\
score={self.score},\
created_at={self.created_at},\
)>"
