from sqlalchemy import BigInteger, Column, DateTime, Integer, String, text
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class UserTip(Base, RepresentableMixin):
    __tablename__ = "user_tips"

    slot = Column(Integer, primary_key=True, nullable=False, index=True)
    signature = Column(String, primary_key=True, nullable=False)
    sender_user_id = Column(Integer, nullable=False, index=True)
    receiver_user_id = Column(Integer, nullable=False, index=True)
    amount = Column(BigInteger, nullable=False)
    created_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
