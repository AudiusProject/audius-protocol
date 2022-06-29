from sqlalchemy import Column, DateTime, Integer, String, func
from src.models.base import Base


class SPLTokenTransaction(Base):
    __tablename__ = "spl_token_tx"
    last_scanned_slot = Column(Integer, primary_key=True, nullable=False)
    signature = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )

    def __repr__(self):
        return f"<SPLTokenTransaction\
last_scanned_slot={self.last_scanned_slot},\
signature={self.signature},\
created_at={self.created_at}\
updated_at={self.updated_at}\
>"
