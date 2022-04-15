from sqlalchemy import BigInteger, Column, Integer, PrimaryKeyConstraint

from .models import Base


class AggregateUserTips(Base):
    __tablename__ = "aggregate_user_tips"
    sender_user_id = Column(Integer, nullable=False, index=True)
    receiver_user_id = Column(Integer, nullable=False, index=True)
    amount = Column(BigInteger, nullable=False)

    PrimaryKeyConstraint(sender_user_id, receiver_user_id)

    def __repr__(self):
        return f"<AggregateUserTips\
sender_user_id={self.sender_user_id},\
receiver_user_id={self.receiver_user_id},\
amount={self.amount},\
>"
