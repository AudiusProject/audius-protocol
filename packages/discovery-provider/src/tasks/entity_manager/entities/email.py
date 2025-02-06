from src.exceptions import IndexingValidationError
from src.models.users.email import EmailAccess, EncryptedEmail
from src.tasks.entity_manager.utils import Action, EntityType, ManageEntityParameters
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

        if params.action not in [Action.ADD_EMAIL]:
            raise IndexingValidationError(
                "email.py | Expected action to be AddEmail or UpdateEmail"
            )

        # Validate required fields
        required_fields = [
            "email_owner_user_id",
            "encrypted_email",
            "access_grants",  # New field containing list of access grants
        ]
        missing_fields = [
            field for field in required_fields if not params.metadata.get(field)
        ]
        if missing_fields:
            raise IndexingValidationError(
                f"Missing required fields: {', '.join(missing_fields)}"
            )

        # Validate access_grants structure
        access_grants = params.metadata["access_grants"]
        if not isinstance(access_grants, list):
            raise IndexingValidationError("access_grants must be a list")

        for grant in access_grants:
            if not {"receiving_user_id", "grantor_user_id", "encrypted_key"}.issubset(
                grant
            ):
                raise IndexingValidationError(
                    "Each access grant must contain receiving_user_id, grantor_user_id, and encrypted_key"
                )

    except Exception as e:
        logger.error(
            "email.py | Error validating email metadata",
            extra={
                "error": str(e),
                "action": params.action,
                "email_owner_user_id": params.metadata.get("email_owner_user_id"),
            },
        )
        raise


def create_encrypted_email(params: ManageEntityParameters) -> None:
    """Create a new encrypted email record with access grants."""
    logger.debug(
        "email.py | Processing create email request",
        extra={"email_owner_user_id": params.metadata.get("email_owner_user_id")},
    )

    try:
        validate_email_metadata(params)

        # Check for existing email
        existing_email = (
            params.session.query(EncryptedEmail)
            .filter(
                EncryptedEmail.email_owner_user_id
                == params.metadata["email_owner_user_id"]
            )
            .first()
        )
        if existing_email:
            logger.info(
                "email.py | Email already exists",
                extra={"email_owner_user_id": params.metadata["email_owner_user_id"]},
            )
            return

        # Create email record
        new_email = EncryptedEmail(
            email_owner_user_id=params.metadata["email_owner_user_id"],
            encrypted_email=params.metadata["encrypted_email"],
        )
        params.add_record(
            params.metadata["email_owner_user_id"],
            new_email,
            EntityType.ENCRYPTED_EMAIL,
        )

        # Create access records
        for grant in params.metadata["access_grants"]:
            # Check if access already exists
            existing_access = (
                params.session.query(EmailAccess)
                .filter(
                    EmailAccess.email_owner_user_id
                    == params.metadata["email_owner_user_id"],
                    EmailAccess.receiving_user_id == grant["receiving_user_id"],
                    EmailAccess.grantor_user_id == grant["grantor_user_id"],
                )
                .first()
            )
            if existing_access:
                logger.debug(
                    "email.py | Email access already exists",
                    extra={
                        "email_owner_user_id": params.metadata["email_owner_user_id"],
                        "receiving_user_id": grant["receiving_user_id"],
                        "grantor_user_id": grant["grantor_user_id"],
                    },
                )
                continue

            new_access = EmailAccess(
                email_owner_user_id=params.metadata["email_owner_user_id"],
                receiving_user_id=grant["receiving_user_id"],
                grantor_user_id=grant["grantor_user_id"],
                encrypted_key=grant["encrypted_key"],
            )
            params.add_record(
                grant["receiving_user_id"], new_access, EntityType.EMAIL_ACCESS
            )

        logger.debug(
            "email.py | Successfully created encrypted email",
            extra={"email_owner_user_id": params.metadata["email_owner_user_id"]},
        )

    except Exception as e:
        logger.error(
            "email.py | Error creating encrypted email",
            extra={
                "error": str(e),
                "email_owner_user_id": params.metadata.get("email_owner_user_id"),
            },
        )
        raise


def grant_email_access(params: ManageEntityParameters) -> None:
    """Grant access to an encrypted email."""
    try:
        if not isinstance(params.metadata, dict):
            raise IndexingValidationError("Email metadata must be a dictionary")

        # Validate required fields
        required_fields = [
            "email_owner_user_id",
            "access_grants",
        ]
        missing_fields = [
            field for field in required_fields if not params.metadata.get(field)
        ]
        if missing_fields:
            raise IndexingValidationError(
                f"Missing required fields: {', '.join(missing_fields)}"
            )

        # Validate access_grants structure
        access_grants = params.metadata["access_grants"]
        if not isinstance(access_grants, list):
            raise IndexingValidationError("access_grants must be a list")

        for grant in access_grants:
            if not {"receiving_user_id", "grantor_user_id", "encrypted_key"}.issubset(
                grant
            ):
                raise IndexingValidationError(
                    "Each access grant must contain receiving_user_id, grantor_user_id, and encrypted_key"
                )

            # Verify grantor has access for each grant
            grantor_access = (
                params.session.query(EmailAccess)
                .filter(
                    EmailAccess.email_owner_user_id
                    == params.metadata["email_owner_user_id"],
                    EmailAccess.receiving_user_id == grant["grantor_user_id"],
                )
                .first()
            )
            if not grantor_access:
                raise IndexingValidationError(
                    f"Grantor {grant['grantor_user_id']} does not have access to the email"
                )

            # Check if access already exists
            existing_access = (
                params.session.query(EmailAccess)
                .filter(
                    EmailAccess.email_owner_user_id
                    == params.metadata["email_owner_user_id"],
                    EmailAccess.receiving_user_id == grant["receiving_user_id"],
                    EmailAccess.grantor_user_id == grant["grantor_user_id"],
                )
                .first()
            )
            if existing_access:
                logger.debug(
                    "email.py | Email access already exists",
                    extra={
                        "email_owner_user_id": params.metadata["email_owner_user_id"],
                        "receiving_user_id": grant["receiving_user_id"],
                        "grantor_user_id": grant["grantor_user_id"],
                    },
                )
                continue

            # Create new access record for each grant
            new_access = EmailAccess(
                email_owner_user_id=params.metadata["email_owner_user_id"],
                receiving_user_id=grant["receiving_user_id"],
                grantor_user_id=grant["grantor_user_id"],
                encrypted_key=grant["encrypted_key"],
            )
            params.add_record(
                grant["receiving_user_id"], new_access, EntityType.EMAIL_ACCESS
            )

    except Exception as e:
        logger.error(
            "email.py | Error granting email access",
            extra={
                "error": str(e),
                "email_owner_user_id": params.metadata.get("email_owner_user_id"),
            },
        )
        raise
