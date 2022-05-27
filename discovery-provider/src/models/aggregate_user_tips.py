from sqlalchemy import BigInteger, Column, Integer, PrimaryKeyConstraint

from .models import Base, RepresentableMixin


class AggregateUserTips(Base, RepresentableMixin):
    __tablename__ = "aggregate_user_tips"
    sender_user_id = Column(Integer, nullable=False)
    receiver_user_id = Column(Integer, nullable=False, index=True)
    amount = Column(BigInteger, nullable=False)

    PrimaryKeyConstraint(sender_user_id, receiver_user_id)
