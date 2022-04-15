from sqlalchemy import BigInteger, Column, DateTime, Integer, String, func

from .models import Base


class UserTip(Base):
    __tablename__ = "user_tips"
    user_tip_id = Column(Integer, nullable=False, primary_key=True, autoincrement=True)
    signature = Column(String, nullable=False)
    sender_user_id = Column(Integer, nullable=False, index=True)
    receiver_user_id = Column(Integer, nullable=False, index=True)
    amount = Column(BigInteger, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())

    def __repr__(self):
        return f"<UserTip\
user_tip_id={self.user_tip_id},\
signature={self.signature},\
sender_user_id={self.sender_user_id},\
receiver_user_id={self.receiver_user_id},\
amount={self.amount},\
created_at={self.created_at}\
>"
