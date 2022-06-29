from sqlalchemy import Column, Integer, String
from src.models.base import Base


class AudiusDataTx(Base):
    __tablename__ = "audius_data_txs"
    signature = Column(String, primary_key=True, nullable=False)
    slot = Column(Integer, nullable=False)

    def __repr__(self):
        return f"<AudiusDataTx,\
self._signature={self.self._signature},\
self.slot={self.self.slot})>"
