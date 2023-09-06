import json
from typing import Optional, TypedDict, Union, cast

from src.exceptions import IndexingValidationError
from src.models.grants.grant import Grant
from src.tasks.entity_manager.utils import (
    Action,
    EntityType,
    ManageEntityParameters,
    copy_record,
)
from src.utils.indexing_errors import EntityMissingRequiredFieldError
from src.utils.model_nullable_validator import all_required_fields_present
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)


class CreateGrantMetadata(TypedDict):
    grantee_address: Union[str, None]


class RevokeGrantMetadata(TypedDict):
    grantee_address: Union[str, None]


def get_grant_metadata_from_raw(
    raw_metadata: Optional[str],
) -> Optional[CreateGrantMetadata]:
    metadata: CreateGrantMetadata = {
        "grantee_address": None,
    }
    if raw_metadata:
        try:
            json_metadata = json.loads(raw_metadata)
            raw_grantee_address = json_metadata.get("grantee_address", None)
            if raw_grantee_address:
                metadata["grantee_address"] = raw_grantee_address.lower()
            else:
                metadata["grantee_address"] = None
            return metadata
        except Exception as e:
            logger.error(
                f"entity_manager | grant.py | Unable to parse grant metadata while indexing: {e}"
            )
            return None
    return metadata


def validate_grant_tx(params: ManageEntityParameters, metadata):
    user_id = params.user_id

    if params.entity_type != EntityType.GRANT:
        raise IndexingValidationError(
            f"Invalid Create Grant transaction, wrong entity type {params.entity_type}"
        )
    if not metadata["grantee_address"]:
        raise IndexingValidationError(
            "Invalid Create Grant transaction, grantee address is required and was not provided"
        )
    if not user_id:
        raise IndexingValidationError(
            "Invalid Create Grant transaction, user id is required and was not provided"
        )
    if user_id not in params.existing_records["User"]:
        raise IndexingValidationError(
            f"Invalid Create Grant transaction, user id {user_id} does not exist"
        )
    if not params.existing_records["User"][user_id].wallet:
        raise IndexingValidationError(
            "Programming error while indexing Create Grant transaction, user wallet missing"
        )
    grant_key = (metadata["grantee_address"], user_id)

    if params.action == Action.CREATE:
        if not metadata["grantee_address"]:
            raise IndexingValidationError(
                "Invalid Create Grant transaction, developer app address is required and was not provided"
            )
        if metadata["grantee_address"] not in params.existing_records["DeveloperApp"]:
            raise IndexingValidationError(
                f"Invalid Create Grant transaction, developer app address {metadata['grantee_address']} does not exist"
            )
        if (
            metadata["grantee_address"] in params.existing_records["DeveloperApp"]
            and params.existing_records["DeveloperApp"][
                metadata["grantee_address"]
            ].is_delete
        ):
            raise IndexingValidationError(
                f"Invalid Grant transaction, developer app address {metadata['grantee_address']} is invalid"
            )
        if (
            grant_key in params.existing_records["Grant"]
            and not params.existing_records["Grant"][grant_key].is_revoked
        ):
            raise IndexingValidationError(
                f"Invalid Create Grant transaction, active grant from {user_id} to {metadata['grantee_address']} already exists"
            )

        wallet = params.existing_records["User"][user_id].wallet
        if wallet and wallet.lower() != params.signer.lower():
            raise IndexingValidationError(
                "Invalid Create Grant transaction, user does not match signer"
            )
    elif params.action == Action.DELETE:
        if grant_key not in params.existing_records["Grant"]:
            raise IndexingValidationError(
                f"Invalid Delete Grant transaction, grant from {user_id} to {metadata['grantee_address']} does not exist"
            )
        existing_grant = params.existing_records["Grant"][grant_key]
        if existing_grant.is_revoked:
            raise IndexingValidationError(
                f"Invalid Delete Grant Transaction, grant from {user_id} to {metadata['grantee_address']} is already revoked."
            )

        # Signer can be either the user in the grant or the developer app.
        wallet = params.existing_records["User"][user_id].wallet
        if (
            wallet
            and wallet.lower() != params.signer.lower()
            and params.signer.lower() != existing_grant.grantee_address.lower()
        ):
            raise IndexingValidationError(
                "Invalid Delete Grant transaction, user does not match signer"
            )
    else:
        raise IndexingValidationError(
            f"Invalid Grant transaction, action {params.action} is not valid"
        )
    return grant_key


def validate_grant_record(grant_record):
    if not all_required_fields_present(Grant, grant_record):
        raise EntityMissingRequiredFieldError(
            "grant",
            grant_record,
            f"Error parsing grant {grant_record} with entity missing required field(s)",
        )

    return grant_record


def create_grant(params: ManageEntityParameters):
    metadata = get_grant_metadata_from_raw(params.metadata)
    if not metadata:
        raise IndexingValidationError(
            "Invalid Grant Transaction, unable to parse metadata"
        )
    grant_key = validate_grant_tx(params, metadata)
    user_id = params.user_id
    grant_record = Grant(
        user_id=user_id,
        grantee_address=cast(
            str, metadata["grantee_address"]
        ),  # cast to assert non null (since we validated above)
        is_current=True,
        is_approved=True,
        txhash=params.txhash,
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
        updated_at=params.block_datetime,
        created_at=params.block_datetime,
    )

    validate_grant_record(grant_record)
    params.add_record(grant_key, grant_record)
    return grant_record


def revoke_grant(params: ManageEntityParameters):
    metadata = get_grant_metadata_from_raw(params.metadata)
    if not metadata:
        raise IndexingValidationError(
            "Invalid Revoke Grant Transaction, unable to parse metadata"
        )
    grant_key = validate_grant_tx(params, metadata)
    existing_grant = params.existing_records["Grant"][grant_key]
    if grant_key in params.new_records["Grant"]:
        existing_grant = params.new_records["Grant"][grant_key][-1]

    revoked_grant = copy_record(
        existing_grant,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )

    revoked_grant.is_revoked = True

    validate_grant_record(revoked_grant)
    params.add_record(grant_key, revoked_grant)
    return revoked_grant
