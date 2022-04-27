from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Integer,
    PrimaryKeyConstraint,
    String,
    func,
)

from .models import Base


class UserTip(Base):
    __tablename__ = "user_tips"
    slot = Column(Integer, nullable=False)
    signature = Column(String, nullable=False, index=True)
    sender_user_id = Column(Integer, nullable=False, index=True)
    receiver_user_id = Column(Integer, nullable=False, index=True)
    amount = Column(BigInteger, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())

    PrimaryKeyConstraint(slot, signature)

    def __repr__(self):
        return f"<UserTip\
slot={self.slot},\
signature={self.signature},\
sender_user_id={self.sender_user_id},\
receiver_user_id={self.receiver_user_id},\
amount={self.amount},\
created_at={self.created_at}\
>"
