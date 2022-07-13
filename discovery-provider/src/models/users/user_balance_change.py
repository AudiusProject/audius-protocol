from sqlalchemy import Column, DateTime, Integer, String, text
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class UserBalanceChange(Base, RepresentableMixin):
    __tablename__ = "user_balance_changes"

    user_id = Column(
        Integer,
        primary_key=True,
    )
    blocknumber = Column(Integer, nullable=False)
    current_balance = Column(String, nullable=False)
    previous_balance = Column(String, nullable=False)
    created_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
