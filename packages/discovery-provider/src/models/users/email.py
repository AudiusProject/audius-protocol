from sqlalchemy import Column, Integer, Text

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class Email(Base, RepresentableMixin):
    """Model class for the emails table.

    Table storing encrypted email addresses associated with users.
    """

    __tablename__ = "emails"

    decryptor_user_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)
    encrypted_email = Column(Text, nullable=False)

    def __repr__(self):
        return (
            f"<Email("
            f"decryptor_user_id={self.decryptor_user_id}, "
            f"user_id={self.user_id}, "
            f"encrypted_email={self.encrypted_email}"
            f")>"
        )
