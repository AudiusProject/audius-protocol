from sqlalchemy import Column, Integer, String
from .models import Base


class TrendingParam(Base):
    """
    Trending Params aggregate the paramters used to calculate trending track scores
    """

    __tablename__ = "trending_params"

    track_id = Column(Integer, nullable=False, index=True, primary_key=True)
    genre = Column(String, nullable=True)
    owner_id = Column(Integer, nullable=False)
    play_count = Column(Integer, nullable=False)
    owner_follower_count = Column(Integer, nullable=False)
    repost_count = Column(Integer, nullable=False)
    repost_week_count = Column(Integer, nullable=False)
    repost_month_count = Column(Integer, nullable=False)
    repost_year_count = Column(Integer, nullable=False)
    save_count = Column(Integer, nullable=False)
    save_week_count = Column(Integer, nullable=False)
    save_month_count = Column(Integer, nullable=False)
    save_year_count = Column(Integer, nullable=False)
    karma = Column(Integer, nullable=False)

    def __repr__(self):
        return f"<TrendingParam(\
track_id={self.track_id},\
genre={self.genre},\
owner_id={self.owner_id},\
play_count={self.play_count},\
owner_follower_count={self.owner_follower_count},\
repost_count={self.repost_count},\
repost_week_count={self.repost_week_count},\
repost_month_count={self.repost_month_count},\
repost_year_count={self.repost_year_count},\
save_count={self.save_count},\
save_week_count={self.save_week_count},\
save_month_count={self.save_month_count},\
save_year_count={self.save_year_count},\
karma={self.karma},\
)>"
