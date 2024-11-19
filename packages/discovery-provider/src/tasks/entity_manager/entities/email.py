from sqlalchemy import func

from src.exceptions import IndexingValidationError
from src.models.emails.encrypted_emails import EncryptedEmail
from src.models.emails.email_encryption_keys import EmailEncryptionKey
from src.models.emails.email_grantee_keys import EmailGranteeKey
from src.tasks.entity_manager.utils import (
    Action,
    EntityType,
    ManageEntityParameters,
    copy_record,
    validate_signer,
)
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)


def validate_write_encrypted_email_tx(params: ManageEntityParameters):
    email_id = params.entity_id
    validate_signer(params)
    if params.action == Action.CREATE:
        if email_id in params.existing_records[EntityType.ENCRYPTED_EMAIL.value]:
            raise IndexingValidationError(f"Encrypted email {email_id} already exists")
    if params.action == Action.UPDATE:
        if email_id not in params.existing_records[EntityType.ENCRYPTED_EMAIL.value]:
            raise IndexingValidationError(
                f"Cannot update encrypted email {email_id} that does not exist"
            )

    if "encrypted_email" not in params.metadata or not params.metadata["encrypted_email"]:
        raise IndexingValidationError("Encrypted email content is required")
    
    if "seller_user_id" not in params.metadata or not params.metadata["seller_user_id"]:
        raise IndexingValidationError("Seller user ID is required")


def validate_write_encryption_key_tx(params: ManageEntityParameters):
    key_id = params.entity_id
    validate_signer(params)
    if params.action == Action.CREATE:
        if key_id in params.existing_records[EntityType.EMAIL_ENCRYPTION_KEY.value]:
            raise IndexingValidationError(f"Encryption key {key_id} already exists")
        
        # Check if seller already has a key
        seller_id = params.metadata.get("seller_user_id")
        existing_key = params.session.query(EmailEncryptionKey).filter(
            EmailEncryptionKey.seller_user_id == seller_id
        ).first()
        if existing_key:
            raise IndexingValidationError(f"Seller {seller_id} already has an encryption key")
    
    if params.action == Action.UPDATE:
        if key_id not in params.existing_records[EntityType.EMAIL_ENCRYPTION_KEY.value]:
            raise IndexingValidationError(
                f"Cannot update encryption key {key_id} that does not exist"
            )

    if "owner_key" not in params.metadata or not params.metadata["owner_key"]:
        raise IndexingValidationError("Owner key is required")
    
    if "seller_user_id" not in params.metadata or not params.metadata["seller_user_id"]:
        raise IndexingValidationError("Seller user ID is required")


def validate_write_grantee_key_tx(params: ManageEntityParameters):
    grantee_key_id = params.entity_id
    validate_signer(params)
    if params.action == Action.CREATE:
        if grantee_key_id in params.existing_records[EntityType.EMAIL_GRANTEE_KEY.value]:
            raise IndexingValidationError(f"Grantee key {grantee_key_id} already exists")
        
        # Check if this seller-grantee pair already exists
        seller_id = params.metadata.get("seller_user_id")
        grantee_id = params.metadata.get("grantee_user_id")
        existing_key = params.session.query(EmailGranteeKey).filter(
            EmailGranteeKey.seller_user_id == seller_id,
            EmailGranteeKey.grantee_user_id == grantee_id
        ).first()
        if existing_key:
            raise IndexingValidationError(
                f"Grantee key for seller {seller_id} and grantee {grantee_id} already exists"
            )
    
    if params.action == Action.UPDATE:
        if grantee_key_id not in params.existing_records[EntityType.EMAIL_GRANTEE_KEY.value]:
            raise IndexingValidationError(
                f"Cannot update grantee key {grantee_key_id} that does not exist"
            )

    if "encrypted_key" not in params.metadata or not params.metadata["encrypted_key"]:
        raise IndexingValidationError("Encrypted key is required")
    
    if "seller_user_id" not in params.metadata or not params.metadata["seller_user_id"]:
        raise IndexingValidationError("Seller user ID is required")
    
    if "grantee_user_id" not in params.metadata or not params.metadata["grantee_user_id"]:
        raise IndexingValidationError("Grantee user ID is required")


def create_encrypted_email(params: ManageEntityParameters):
    """Creates a new encrypted email record."""
    validate_write_encrypted_email_tx(params)
    
    email = EncryptedEmail(
        email_id=params.entity_id,
        seller_user_id=params.metadata["seller_user_id"],
        encrypted_email=params.metadata["encrypted_email"],
    )
    params.session.add(email)
    return email


def create_encryption_key(params: ManageEntityParameters):
    """Creates a new encryption key record for a seller."""
    validate_write_encryption_key_tx(params)
    
    key = EmailEncryptionKey(
        key_id=params.entity_id,
        seller_user_id=params.metadata["seller_user_id"],
        owner_key=params.metadata["owner_key"],
    )
    params.session.add(key)
    return key


def create_grantee_key(params: ManageEntityParameters):
    """Creates a new grantee key record."""
    validate_write_grantee_key_tx(params)
    
    key = EmailGranteeKey(
        grantee_key_id=params.entity_id,
        seller_user_id=params.metadata["seller_user_id"],
        grantee_user_id=params.metadata["grantee_user_id"],
        encrypted_key=params.metadata["encrypted_key"],
    )
    params.session.add(key)
    return key


def update_encrypted_email(params: ManageEntityParameters):
    """Updates an existing encrypted email record."""
    validate_write_encrypted_email_tx(params)
    
    email = params.existing_records[EntityType.ENCRYPTED_EMAIL.value][params.entity_id]
    email.encrypted_email = params.metadata["encrypted_email"]
    return email


def update_encryption_key(params: ManageEntityParameters):
    """Updates an existing encryption key record."""
    validate_write_encryption_key_tx(params)
    
    key = params.existing_records[EntityType.EMAIL_ENCRYPTION_KEY.value][params.entity_id]
    key.owner_key = params.metadata["owner_key"]
    return key


def update_grantee_key(params: ManageEntityParameters):
    """Updates an existing grantee key record."""
    validate_write_grantee_key_tx(params)
    
    key = params.existing_records[EntityType.EMAIL_GRANTEE_KEY.value][params.entity_id]
    key.encrypted_key = params.metadata["encrypted_key"]
    return key
