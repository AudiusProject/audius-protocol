from sqlalchemy import Column, DateTime, Integer, String, text

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class UserBalance(Base, RepresentableMixin):
    __tablename__ = "user_balances"

    user_id = Column(
        Integer,
        primary_key=True,
    )

    # balance in Wei
    balance = Column(String, nullable=False)
    created_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    associated_wallets_balance = Column(
        String, nullable=False, server_default=text("'0'::character varying")
    )
    # wAudio balance
    waudio = Column(String, server_default=text("'0'::character varying"))

    associated_sol_wallets_balance = Column(
        String, nullable=False, server_default=text("'0'::character varying")
    )
