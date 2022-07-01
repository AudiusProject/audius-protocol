from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Integer,
    PrimaryKeyConstraint,
    String,
    func,
)
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class UserTip(Base, RepresentableMixin):
    __tablename__ = "user_tips"
    signature = Column(String, nullable=False)
    slot = Column(Integer, nullable=False, index=True)
    sender_user_id = Column(Integer, nullable=False, index=True)
    receiver_user_id = Column(Integer, nullable=False, index=True)
    amount = Column(BigInteger, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )

    PrimaryKeyConstraint(signature)
