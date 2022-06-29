from sqlalchemy import Column, DateTime, Integer
from src.models.base import Base


class ListenStreakChallenge(Base):
    __tablename__ = "challenge_listen_streak"

    user_id = Column(Integer, nullable=False, primary_key=True)
    last_listen_date = Column(DateTime)
    listen_streak = Column(Integer, nullable=False)

    def __repr__(self):
        return f"<ListenStreakChallenge,\
user_id={self.user_id},\
last_listen_date={self.last_listen_date},\
listen_streak={self.listen_streak})>"
