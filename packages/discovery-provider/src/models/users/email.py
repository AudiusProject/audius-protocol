from sqlalchemy import Column, DateTime, Integer, Text, UniqueConstraint
from sqlalchemy.sql import func

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class EncryptedEmail(Base, RepresentableMixin):
    """Model class for the encrypted_emails table.

    Table storing encrypted emails for users.
    """

    __tablename__ = "encrypted_emails"

    id = Column(Integer, primary_key=True)
    email_owner_user_id = Column(Integer, nullable=False)
    encrypted_email = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("email_owner_user_id", name="uq_encrypted_email_owner"),
    )

    def to_dict(self):
        """Convert model to dictionary."""
        return {
            "id": self.id,
            "email_owner_user_id": self.email_owner_user_id,
            "encrypted_email": self.encrypted_email,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class EmailAccess(Base, RepresentableMixin):
    """Model class for the email_access table.

    Table storing access grants and encrypted keys for email access.
    """

    __tablename__ = "email_access"

    id = Column(Integer, primary_key=True)
    email_owner_user_id = Column(Integer, nullable=False)
    receiving_user_id = Column(Integer, nullable=False)
    grantor_user_id = Column(Integer, nullable=False)
    encrypted_key = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "email_owner_user_id",
            "receiving_user_id",
            "grantor_user_id",
            name="uq_email_access",
        ),
    )

    def to_dict(self):
        """Convert model to dictionary."""
        return {
            "id": self.id,
            "email_owner_user_id": self.email_owner_user_id,
            "receiving_user_id": self.receiving_user_id,
            "grantor_user_id": self.grantor_user_id,
            "encrypted_key": self.encrypted_key,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
