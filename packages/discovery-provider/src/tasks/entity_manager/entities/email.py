from typing import List, Optional

from src.exceptions import IndexingValidationError
from src.models.users.email import EmailAccessKey, EmailEncryptionKey, EncryptedEmail
from src.tasks.entity_manager.utils import (
    Action,
    EntityType,
    ManageEntityParameters,
    validate_signer,
)
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)


def validate_email_metadata(params: ManageEntityParameters) -> None:
    """
    Validates the required fields in email metadata
    Raises IndexingValidationError if validation fails
    """
    try:
        if not isinstance(params.metadata, dict):
            raise IndexingValidationError("Email metadata must be a dictionary")

        primary_user_id = params.metadata.get("primary_user_id")
        if not primary_user_id:
            raise IndexingValidationError("primary_user_id is required")

        if params.action in [Action.ADD_EMAIL, Action.UPDATE_EMAIL]:
            required_fields = [
                "primary_user_id",
                "email_owner_user_id",
                "encrypted_email",
                "encrypted_key",
            ]
            missing_fields = [
                field for field in required_fields if not params.metadata.get(field)
            ]
            if missing_fields:
                raise IndexingValidationError(
                    f"Missing required fields: {', '.join(missing_fields)}"
                )

    except Exception as e:
        logger.error(
            "email.py | Error validating email metadata",
            extra={
                "error": str(e),
                "action": params.action,
                "primary_user_id": params.metadata.get("primary_user_id"),
            },
        )
        raise


def validate_delegated_access(
    delegated_user_ids: List[int], delegated_keys: List[str]
) -> None:
    """
    Validates delegated access data
    Raises IndexingValidationError if validation fails
    """
    if len(delegated_user_ids) != len(delegated_keys):
        raise IndexingValidationError(
            f"Mismatched number of delegated users ({len(delegated_user_ids)}) and keys ({len(delegated_keys)})"
        )


def get_existing_email(
    params: ManageEntityParameters,
) -> Optional[EncryptedEmail]:
    """Gets existing email record if it exists"""
    try:
        return (
            params.session.query(EncryptedEmail)
            .filter(
                EncryptedEmail.primary_user_id == params.metadata["primary_user_id"],
                EncryptedEmail.email_owner_user_id
                == params.metadata["email_owner_user_id"],
            )
            .first()
        )
    except Exception as e:
        logger.error(
            "email.py | Error fetching existing email",
            extra={
                "error": str(e),
                "primary_user_id": params.metadata.get("primary_user_id"),
                "email_owner_user_id": params.metadata.get("email_owner_user_id"),
            },
        )
        raise


def handle_delegated_access(
    params: ManageEntityParameters,
) -> None:
    """
    Handles creation/update of delegated access keys
    """
    try:
        delegated_user_ids = params.metadata.get("delegated_user_ids", [])
        delegated_keys = params.metadata.get("delegated_keys", [])

        validate_delegated_access(delegated_user_ids, delegated_keys)

        # Remove existing access keys if updating
        if params.action == Action.UPDATE_EMAIL:
            params.session.query(EmailAccessKey).filter(
                EmailAccessKey.primary_user_id == params.metadata["primary_user_id"]
            ).delete()

        # Add new access keys
        for delegated_user_id, delegated_key in zip(delegated_user_ids, delegated_keys):
            new_access_key = EmailAccessKey(
                primary_user_id=params.metadata["primary_user_id"],
                delegated_user_id=delegated_user_id,
                encrypted_key=delegated_key,
            )
            params.add_record(
                params.metadata["primary_user_id"],
                new_access_key,
                EntityType.EMAIL_ACCESS_KEY,
            )

    except Exception as e:
        logger.error(
            "email.py | Error handling delegated access",
            extra={
                "error": str(e),
                "primary_user_id": params.metadata.get("primary_user_id"),
            },
        )
        raise


def create_encrypted_email(params: ManageEntityParameters) -> None:
    """Create a new encrypted email record with encryption key and optional delegated access."""
    logger.debug(
        "email.py | Processing create email request",
        extra={"primary_user_id": params.metadata.get("primary_user_id")},
    )

    try:
        validate_signer(params)
        validate_email_metadata(params)

        # Check for existing email
        if get_existing_email(params):
            logger.info(
                "email.py | Email already exists",
                extra={
                    "primary_user_id": params.metadata["primary_user_id"],
                    "email_owner_user_id": params.metadata["email_owner_user_id"],
                },
            )
            return

        # Create email record
        new_email = EncryptedEmail(
            email_owner_user_id=params.metadata["email_owner_user_id"],
            primary_user_id=params.metadata["primary_user_id"],
            encrypted_email=params.metadata["encrypted_email"],
        )
        params.add_record(
            params.metadata["primary_user_id"], new_email, EntityType.ENCRYPTED_EMAIL
        )

        # Create encryption key record
        new_key = EmailEncryptionKey(
            primary_user_id=params.metadata["primary_user_id"],
            encrypted_key=params.metadata["encrypted_key"],
        )
        params.add_record(
            params.metadata["primary_user_id"], new_key, EntityType.EMAIL_ENCRYPTION_KEY
        )

        # Handle delegated access
        handle_delegated_access(params)

        logger.debug(
            "email.py | Successfully created encrypted email",
            extra={"primary_user_id": params.metadata["primary_user_id"]},
        )

    except Exception as e:
        logger.error(
            "email.py | Error creating encrypted email",
            extra={
                "error": str(e),
                "primary_user_id": params.metadata.get("primary_user_id"),
            },
        )
        raise


def update_encrypted_email(params: ManageEntityParameters) -> None:
    """Update an encrypted email record with encryption key and delegated access."""
    logger.debug(
        "email.py | Processing update email request",
        extra={"primary_user_id": params.metadata.get("primary_user_id")},
    )

    try:
        validate_signer(params)
        validate_email_metadata(params)

        # Get existing email
        email = get_existing_email(params)
        if not email:
            raise IndexingValidationError("Email record not found")

        # Update email
        email.encrypted_email = params.metadata["encrypted_email"]
        params.add_record(
            params.metadata["primary_user_id"], email, EntityType.ENCRYPTED_EMAIL
        )

        # Update encryption key
        key = (
            params.session.query(EmailEncryptionKey)
            .filter(
                EmailEncryptionKey.primary_user_id == params.metadata["primary_user_id"]
            )
            .first()
        )

        if key:
            key.encrypted_key = params.metadata["encrypted_key"]
            params.add_record(
                params.metadata["primary_user_id"], key, EntityType.EMAIL_ENCRYPTION_KEY
            )
        else:
            new_key = EmailEncryptionKey(
                primary_user_id=params.metadata["primary_user_id"],
                encrypted_key=params.metadata["encrypted_key"],
            )
            params.add_record(
                params.metadata["primary_user_id"],
                new_key,
                EntityType.EMAIL_ENCRYPTION_KEY,
            )

        # Handle delegated access
        handle_delegated_access(params)

        logger.debug(
            "email.py | Successfully updated encrypted email",
            extra={"primary_user_id": params.metadata["primary_user_id"]},
        )

    except Exception as e:
        logger.error(
            "email.py | Error updating encrypted email",
            extra={
                "error": str(e),
                "primary_user_id": params.metadata.get("primary_user_id"),
            },
        )
        raise
