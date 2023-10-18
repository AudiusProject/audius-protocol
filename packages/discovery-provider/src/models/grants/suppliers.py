from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    text,
)

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class Supplier(Base, RepresentableMixin):
    __tablename__ = "suppliers"

    wallet = Column(String, primary_key=True, nullable=False)
    supplier_name = Column(String, nullable=False)

    def get_attributes_dict(self):
        return {col.name: getattr(self, col.name) for col in self.__table__.columns}
