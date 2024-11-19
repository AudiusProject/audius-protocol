from sqlalchemy import Column, Integer, Text

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class EncryptedEmail(Base, RepresentableMixin):
    __tablename__ = "encrypted_emails"

    email_id = Column(Integer, primary_key=True)
    seller_user_id = Column(Integer, nullable=False)
    encrypted_email = Column(Text, nullable=False)  # base64 encoded

    def get_attributes_dict(self):
        return {col.name: getattr(self, col.name) for col in self.__table__.columns}
