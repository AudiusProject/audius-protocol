from sqlalchemy import Boolean, Column, DateTime, Integer, String, text

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class Subscription(Base, RepresentableMixin):
    __tablename__ = "subscriptions"

    blockhash = Column(String)
    blocknumber = Column(Integer, index=True)
    subscriber_id = Column(Integer, primary_key=True, nullable=False)
    user_id = Column(Integer, primary_key=True, nullable=False, index=True)
    is_current = Column(Boolean, primary_key=True, nullable=False)
    is_delete = Column(Boolean, nullable=False)
    created_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    txhash = Column(
        String,
        primary_key=True,
        nullable=False,
        server_default=text("''::character varying"),
    )
