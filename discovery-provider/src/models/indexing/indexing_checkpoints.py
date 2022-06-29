from sqlalchemy import Column, Integer, String
from src.models.base import Base


class IndexingCheckpoints(Base):
    __tablename__ = "indexing_checkpoints"

    tablename = Column(String, primary_key=True, nullable=False, index=False)
    last_checkpoint = Column(Integer, nullable=False, index=False)

    def __repr__(self):
        return f"<IndexingCheckpoints(\
tablename={self.tablename},\
last_checkpoint={self.last_checkpoint}>"
