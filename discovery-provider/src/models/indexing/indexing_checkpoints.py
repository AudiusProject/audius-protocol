from sqlalchemy import Column, Integer, String
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class IndexingCheckpoint(Base, RepresentableMixin):
    __tablename__ = "indexing_checkpoints"

    tablename = Column(String, primary_key=True)
    last_checkpoint = Column(Integer, nullable=False)
