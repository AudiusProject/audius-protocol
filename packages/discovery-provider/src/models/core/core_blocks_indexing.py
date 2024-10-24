from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class CoreBlocksIndexing(Base):
    __tablename__ = "core_blocks_indexing"

    blockhash = Column(String, nullable=False)
    parenthash = Column(String)
    chain_id = Column(Text, nullable=False)
    height = Column(Integer, nullable=False)

    def get_attributes_dict(self):
        return {col.name: getattr(self, col.name) for col in self.__table__.columns}
