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
    signature = Column(String, nullable=False)
    slot = Column(Integer, nullable=False, index=True)
    sender_user_id = Column(Integer, nullable=False, index=True)
    receiver_user_id = Column(Integer, nullable=False, index=True)
    amount = Column(BigInteger, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())

    PrimaryKeyConstraint(signature)

    def __repr__(self):
        return f"<UserTip\
signature={self.signature},\
slot={self.slot},\
sender_user_id={self.sender_user_id},\
receiver_user_id={self.receiver_user_id},\
amount={self.amount},\
created_at={self.created_at}\
>"
