from sqlalchemy import Column, Integer, PrimaryKeyConstraint
from src.models.base import Base


class SupporterRankUp(Base):
    __tablename__ = "supporter_rank_ups"
    slot = Column(Integer, nullable=False, index=True)
    sender_user_id = Column(Integer, nullable=False, index=True)
    receiver_user_id = Column(Integer, nullable=False, index=True)
    rank = Column(Integer, nullable=False)
    PrimaryKeyConstraint(slot, sender_user_id, receiver_user_id)

    def __repr__(self):
        return f"<SupporterRankUp\
slot={self.slot},\
sender_user_id={self.sender_user_id},\
receiver_user_id={self.receiver_user_id},\
rank={self.rank}\
>"
