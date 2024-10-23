from sqlalchemy import Column, Integer, String, Text

from src.models.base import Base


class CoreBlocksIndexing(Base):
    __tablename__ = "core_blocks_indexing"

    blockhash = Column(String, nullable=False)
    parenthash = Column(String)
    chain_id = Column(Text, primary_key=True, nullable=False)
    height = Column(Integer, primary_key=True, nullable=False)
