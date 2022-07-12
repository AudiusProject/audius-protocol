from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class UserBalanceChange(Base, RepresentableMixin):
    __tablename__ = "user_balance_changes"

    user_id = Column(Integer, nullable=False, primary_key=True)
    blocknumber = Column(Integer, ForeignKey("blocks.number"), nullable=False)
    current_balance = Column(String, nullable=False)
    previous_balance = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )
