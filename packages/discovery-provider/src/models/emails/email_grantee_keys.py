from sqlalchemy import Column, Integer, Text, UniqueConstraint

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class EmailGranteeKey(Base, RepresentableMixin):
    __tablename__ = "email_grantee_keys"

    grantee_key_id = Column(Integer, primary_key=True)
    seller_user_id = Column(Integer, nullable=False)
    grantee_user_id = Column(Integer, nullable=False)
    encrypted_key = Column(Text, nullable=False)  # base64 encoded

    __table_args__ = (
        UniqueConstraint('seller_user_id', 'grantee_user_id', name='unique_seller_grantee'),
    )

    def get_attributes_dict(self):
        return {col.name: getattr(self, col.name) for col in self.__table__.columns}
