from sqlalchemy import Column, Integer, String

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class AudiusDataTx(Base, RepresentableMixin):
    __tablename__ = "audius_data_txs"

    signature = Column(String, primary_key=True)
    slot = Column(Integer, nullable=False)
