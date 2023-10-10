from sqlalchemy import Column, DateTime, Integer, String, text

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class ChallengeDisbursement(Base, RepresentableMixin):
    __tablename__ = "challenge_disbursements"

    challenge_id = Column(String, primary_key=True, nullable=False)
    user_id = Column(Integer, nullable=False)
    specifier = Column(String, primary_key=True, nullable=False)
    signature = Column(String, nullable=False)
    slot = Column(Integer, nullable=False, index=True)
    # Amount specified in WAUDIO_DECIMALS (10^8).
    amount = Column(String, nullable=False)
    created_at = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), index=True
    )
