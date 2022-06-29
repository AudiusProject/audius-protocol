from sqlalchemy import BigInteger, Column, Integer, PrimaryKeyConstraint
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class AggregateUserTips(Base, RepresentableMixin):
    __tablename__ = "aggregate_user_tips"
    sender_user_id = Column(Integer, nullable=False)
    receiver_user_id = Column(Integer, nullable=False, index=True)
    amount = Column(BigInteger, nullable=False)

    PrimaryKeyConstraint(sender_user_id, receiver_user_id)
