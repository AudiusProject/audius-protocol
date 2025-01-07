from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.schema import PrimaryKeyConstraint

Base = declarative_base()


class CoreIndexedBlocks(Base):
    __tablename__ = "core_indexed_blocks"

    blockhash = Column(String, nullable=False)
    parenthash = Column(String)
    chain_id = Column(Text, nullable=False)
    height = Column(Integer, nullable=False)
    plays_slot = Column(Integer)

    # Set composite primary key
    __table_args__ = (
        PrimaryKeyConstraint("chain_id", "height", name="pk_chain_id_height"),
    )

    def get_attributes_dict(self):
        return {col.name: getattr(self, col.name) for col in self.__table__.columns}
