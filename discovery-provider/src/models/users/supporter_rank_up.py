from sqlalchemy import Column, Integer, PrimaryKeyConstraint
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class SupporterRankUp(Base, RepresentableMixin):
    __tablename__ = "supporter_rank_ups"
    slot = Column(Integer, nullable=False, index=True)
    sender_user_id = Column(Integer, nullable=False, index=True)
    receiver_user_id = Column(Integer, nullable=False, index=True)
    rank = Column(Integer, nullable=False)
    PrimaryKeyConstraint(slot, sender_user_id, receiver_user_id)
