from sqlalchemy import Column, Integer
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class SupporterRankUp(Base, RepresentableMixin):
    __tablename__ = "supporter_rank_ups"

    slot = Column(Integer, primary_key=True, nullable=False, index=True)
    sender_user_id = Column(Integer, primary_key=True, nullable=False, index=True)
    receiver_user_id = Column(Integer, primary_key=True, nullable=False, index=True)
    rank = Column(Integer, nullable=False)
