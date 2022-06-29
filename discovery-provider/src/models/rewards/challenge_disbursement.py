from sqlalchemy import Column, ForeignKey, Integer, PrimaryKeyConstraint, String
from src.models.base import Base


class ChallengeDisbursement(Base):
    __tablename__ = "challenge_disbursements"

    challenge_id = Column(String, ForeignKey("challenges.id"), nullable=False)
    user_id = Column(Integer, nullable=False)
    amount = Column(String, nullable=False)
    signature = Column(String, nullable=False)
    slot = Column(Integer, nullable=False)
    specifier = Column(String, nullable=False)

    PrimaryKeyConstraint(challenge_id, specifier)

    def __repr__(self):
        return f"<ChallengeDisbursement,\
challenge_id={self.challenge_id},\
user_id={self.user_id},\
amount={self.amount},\
signature={self.signature},\
slot={self.slot},\
specifier={self.specifier})>"
