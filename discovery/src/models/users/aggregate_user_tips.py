from sqlalchemy import BigInteger, Column, Integer

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class AggregateUserTip(Base, RepresentableMixin):
    __tablename__ = "aggregate_user_tips"

    sender_user_id = Column(Integer, primary_key=True, nullable=False)
    receiver_user_id = Column(Integer, primary_key=True, nullable=False, index=True)
    amount = Column(BigInteger, nullable=False)
