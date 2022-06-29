from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from src.models.base import Base


class UserBalanceChange(Base):
    __tablename__ = "user_balance_changes"

    user_id = Column(Integer, nullable=False, primary_key=True)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=False)
    current_balance = Column(String, nullable=False)
    previous_balance = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )

    def __repr__(self):
        return f"<UserBalanceChange(\
user_id={self.user_id},\
blocknumber={self.blocknumber},\
current_balance={self.current_balance},\
previous_balance={self.previous_balance})>"
