from sqlalchemy import Column, ForeignKey, Integer, PrimaryKeyConstraint, String
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class ChallengeDisbursement(Base, RepresentableMixin):
    __tablename__ = "challenge_disbursements"

    challenge_id = Column(String, ForeignKey("challenges.id"), nullable=False)
    user_id = Column(Integer, nullable=False)
    amount = Column(String, nullable=False)
    signature = Column(String, nullable=False)
    slot = Column(Integer, nullable=False)
    specifier = Column(String, nullable=False)

    PrimaryKeyConstraint(challenge_id, specifier)
