from sqlalchemy import Column, Integer, Text, DateTime, UniqueConstraint
from sqlalchemy.sql import func

from src.models.base import Base
from src.models.model_utils import RepresentableMixin


class EncryptedEmail(Base, RepresentableMixin):
    """Model class for the encrypted_emails table.

    Table storing encrypted emails and their metadata for secure communication between users.
    """

    __tablename__ = "encrypted_emails"

    id = Column(Integer, primary_key=True)
    email_address_owner_user_id = Column(Integer, nullable=False)
    primary_access_user_id = Column(Integer, nullable=False)
    encrypted_email = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class EmailEncryptionKey(Base, RepresentableMixin):
    """Model class for the email_encryption_keys table.

    Table storing encryption keys for users with primary access to manage encrypted emails.
    """

    __tablename__ = "email_encryption_keys"

    id = Column(Integer, primary_key=True)
    primary_access_user_id = Column(Integer, nullable=False, unique=True)
    encrypted_key = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class EmailAccessKey(Base, RepresentableMixin):
    """Model class for the email_access_keys table.

    Table storing encrypted keys for users with delegated access to view emails.
    """

    __tablename__ = "email_access_keys"

    id = Column(Integer, primary_key=True)
    primary_access_user_id = Column(Integer, nullable=False)
    delegated_access_user_id = Column(Integer, nullable=False)
    encrypted_key = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("primary_access_user_id", "delegated_access_user_id"),
    )
