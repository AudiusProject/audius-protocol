from sqlalchemy import Column, Integer, String
from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class IndexingCheckpoints(Base, RepresentableMixin):
    __tablename__ = "indexing_checkpoints"

    tablename = Column(String, primary_key=True, nullable=False, index=False)
    last_checkpoint = Column(Integer, nullable=False, index=False)
