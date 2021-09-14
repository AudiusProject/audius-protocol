from sqlalchemy import Column, Integer, String, Date, PrimaryKeyConstraint
from .models import Base


class TrendingResult(Base):
    """
    Trending Results track the top trending tracks/playlists each week to keep a record of the winners
    for reference in the trending challenges
    """

    __tablename__ = "trending_results"
    user_id = Column(Integer, nullable=False, index=True)
    id = Column(Integer, nullable=False)
    rank = Column(Integer, nullable=False)
    type = Column(String, nullable=False)
    version = Column(String, nullable=False)
    week = Column(Date, nullable=False)
    PrimaryKeyConstraint(rank, type, version, week)

    def __repr__(self):
        return f"<TrendingResult(\
user_id={self.user_id},\
id={self.id},\
type={self.type},\
version={self.version},\
week={self.week},\
)>"
