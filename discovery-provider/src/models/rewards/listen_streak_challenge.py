from sqlalchemy import Column, DateTime, Integer
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class ListenStreakChallenge(Base, RepresentableMixin):
    __tablename__ = "challenge_listen_streak"

    user_id = Column(Integer, nullable=False, primary_key=True)
    last_listen_date = Column(DateTime)
    listen_streak = Column(Integer, nullable=False)
