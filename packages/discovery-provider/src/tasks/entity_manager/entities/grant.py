import json
from typing import Optional, TypedDict, Union, cast

from src.exceptions import IndexingValidationError
from src.models.grants.grant import Grant
from src.tasks.entity_manager.utils import (
    Action,
    EntityType,
    ManageEntityParameters,
    copy_record,
    validate_signer,
)
from src.utils.indexing_errors import EntityMissingRequiredFieldError
from src.utils.model_nullable_validator import all_required_fields_present
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)


class GenericGrantMetadata(TypedDict):
    grantee_address: Union[str, None]
    grantor_user_id: Union[str, None]


class CreateGrantMetadata(TypedDict):
    grantee_address: Union[str, None]


class RevokeGrantMetadata(TypedDict):
    grantee_address: Union[str, None]


class ApproveOrRejectGrantMetadata(TypedDict):
    grantor_user_id: Union[str, None]


def get_grant_metadata_from_raw(
    raw_metadata: Optional[str],
) -> Optional[GenericGrantMetadata]:
    metadata: GenericGrantMetadata = {
        "grantee_address": None,
        "grantor_user_id": None,
    }
    if raw_metadata:
        try:
            json_metadata = json.loads(raw_metadata)
            metadata["grantor_user_id"] = json_metadata.get("grantor_user_id", None)
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
            f"Invalid Grant transaction, wrong entity type {params.entity_type}"
        )
    if not user_id:
        raise IndexingValidationError(
            "Invalid Grant transaction, user id is required and was not provided"
        )
    if user_id not in params.existing_records["User"]:
        raise IndexingValidationError(
            f"Invalid Grant transaction, user id {user_id} does not exist"
        )
    if not params.existing_records["User"][user_id].wallet:
        raise IndexingValidationError(
            "Programming error while indexing Grant transaction, user wallet missing"
        )
    userWallet = (params.existing_records["User"][user_id].wallet).lower()
    signer = params.signer.lower()
    if params.action == Action.APPROVE or params.action == Action.REJECT:
        grant_key = (userWallet, metadata["grantor_user_id"])
    else:
        grant_key = (metadata["grantee_address"], user_id)
    if params.action == Action.CREATE:
        if not metadata["grantee_address"]:
            raise IndexingValidationError(
                "Invalid Create Grant transaction, grantee address is required and was not provided"
            )
        if (
            metadata["grantee_address"] not in params.existing_records["DeveloperApp"]
            and metadata["grantee_address"]
            not in params.existing_records[EntityType.USER_WALLET]
        ):
            raise IndexingValidationError(
                f"Invalid Create Grant transaction, developer app or user with address {metadata['grantee_address']} does not exist"
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
            metadata["grantee_address"]
            in params.existing_records[EntityType.USER_WALLET]
            and params.existing_records[EntityType.USER_WALLET][
                metadata["grantee_address"]
            ].is_deactivated
        ):
            raise IndexingValidationError(
                f"Invalid Grant transaction, grantee address {metadata['grantee_address']} is invalid"
            )
        if (
            grant_key in params.existing_records["Grant"]
            and not params.existing_records["Grant"][grant_key].is_revoked
        ):
            raise IndexingValidationError(
                f"Invalid Create Grant transaction, active grant from {user_id} to {metadata['grantee_address']} already exists"
            )
        validate_signer(params)
    elif (
        params.action == Action.DELETE
        or params.action == Action.APPROVE
        or params.action == Action.REJECT
    ):
        grantor = (
            user_id if params.action == Action.DELETE else metadata["grantor_user_id"]
        )
        grantee = (
            userWallet
            if params.action != Action.DELETE
            else metadata["grantee_address"]
        )
        if not grantor or not grantee:
            raise IndexingValidationError(
                "Invalid Update Grant transaction, missing grantor or grantee information"
            )
        if grant_key not in params.existing_records["Grant"]:
            grants = params.existing_records["Grant"]

            raise IndexingValidationError(
                f"Invalid Update Grant transaction, grant from {grantor} to {grantee} {grant_key} does not exist {grants}"
            )
        existing_grant = params.existing_records["Grant"][grant_key]
        if existing_grant.is_revoked:
            raise IndexingValidationError(
                f"Invalid Update Grant Transaction, grant from {grantor} to {grantee} is already revoked."
            )
        if params.action == Action.DELETE:
            # Signer can be either the user in the grant or the grantee (developer app/manager).
            # TODO (C-4041) - Allow signer to be a grantee of either the user in the grant or the grantee in the grant.
            if (
                userWallet != signer
                and signer != existing_grant.grantee_address.lower()
            ):
                raise IndexingValidationError(
                    "Invalid Delete Grant transaction, user does not match signer"
                )
        else:  # Action == Action.APPROVE or Action.REJECT
            validate_signer(params)
            if existing_grant.is_approved == True:
                raise IndexingValidationError(
                    "Invalid Approve Grant transaction; grant is already approved"
                    if params.action == Action.APPROVE
                    else "Invalid Reject Grant transaction; grant is already approved. You can revoke the grant instead with the DELETE action."
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
    if metadata["grantee_address"] in params.existing_records["UserWallet"]:
        grantee_type = "user"
    else:
        grantee_type = "app"
    grant_record = Grant(
        user_id=user_id,
        grantee_address=cast(
            str, metadata["grantee_address"]
        ),  # cast to assert non null (since we validated above)
        is_current=True,
        is_approved=None if grantee_type == "user" else True,
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


def approve_grant(params: ManageEntityParameters):
    metadata = get_grant_metadata_from_raw(params.metadata)
    if not metadata:
        raise IndexingValidationError(
            "Invalid Approve Grant Transaction, unable to parse metadata"
        )
    grant_key = validate_grant_tx(params, metadata)
    existing_grant = params.existing_records["Grant"][grant_key]
    if grant_key in params.new_records["Grant"]:
        existing_grant = params.new_records["Grant"][grant_key][-1]

    approved_grant = copy_record(
        existing_grant,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )

    approved_grant.is_approved = True

    validate_grant_record(approved_grant)
    params.add_record(grant_key, approved_grant)
    return approved_grant


def reject_grant(params: ManageEntityParameters):
    metadata = get_grant_metadata_from_raw(params.metadata)
    if not metadata:
        raise IndexingValidationError(
            "Invalid Reject Grant Transaction, unable to parse metadata"
        )
    grant_key = validate_grant_tx(params, metadata)
    existing_grant = params.existing_records["Grant"][grant_key]
    if grant_key in params.new_records["Grant"]:
        existing_grant = params.new_records["Grant"][grant_key][-1]

    rejected_grant = copy_record(
        existing_grant,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )

    rejected_grant.is_approved = False

    validate_grant_record(rejected_grant)
    params.add_record(grant_key, rejected_grant)
    return rejected_grant
