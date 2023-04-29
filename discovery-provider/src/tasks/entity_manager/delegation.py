import json
from typing import Optional, TypedDict, Union, cast

from src.models.delegates.delegation import Delegation
from src.tasks.entity_manager.utils import (
    Action,
    EntitySpecialFetchType,
    EntityType,
    ManageEntityParameters,
)
from src.utils.indexing_errors import EntityMissingRequiredFieldError
from src.utils.model_nullable_validator import all_required_fields_present
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)


class CreateDelegationMetadata(TypedDict):
    shared_address: Union[str, None]
    delegate_address: Union[str, None]


def get_create_delegation_metadata_from_raw(
    raw_metadata: Optional[str],
) -> Optional[CreateDelegationMetadata]:
    metadata: CreateDelegationMetadata = {
        "shared_address": None,
        "delegate_address": None,
    }
    if raw_metadata:
        try:
            json_metadata = json.loads(raw_metadata)
            raw_shared_address = json_metadata.get("shared_address", None)
            if raw_shared_address:
                metadata["shared_address"] = raw_shared_address.lower()
            else:
                metadata["shared_address"] = None
            raw_delegate_address = json_metadata.get("delegate_address", None)
            if raw_delegate_address:
                metadata["delegate_address"] = raw_delegate_address.lower()
            else:
                metadata["delegate_address"] = None
            return metadata
        except Exception as e:
            logger.error(
                f"entity_manager | delegation.py | Unable to parse delegate metadata while indexing: {e}"
            )
            return None
    return metadata


def validate_delegation_tx(
    params: ManageEntityParameters, metadata: CreateDelegationMetadata
):
    user_id = params.user_id

    if params.entity_type != EntityType.DELEGATION:
        raise Exception(
            f"Invalid Delegation transaction, wrong entity type {params.entity_type}"
        )

    if params.action == Action.CREATE:
        if not metadata["shared_address"]:
            raise Exception(
                "Invalid Delegation transaction, shared address is required and was not provided"
            )
        if not metadata["delegate_address"]:
            raise Exception(
                "Invalid Delegation transaction, delegate address is required and was not provided"
            )
        if (
            metadata["delegate_address"].lower()
            not in params.existing_records[EntitySpecialFetchType.USER_BY_WALLET]
            and metadata["delegate_address"].lower()
            not in params.existing_records[EntityType.APP_DELEGATE]
        ):
            raise Exception(
                f"Invalid Delegation transaction, delegate address {metadata['delegate_address']} does not exist"
            )
        if (
            metadata["shared_address"].lower()
            in params.existing_records[EntityType.DELEGATION]
        ):
            raise Exception(
                f"Invalid Delegation transaction, shared address {metadata['shared_address']} already exists"
            )
        if not user_id:
            raise Exception(
                "Invalid Delegation transaction, user id is required and was not provided"
            )
        if user_id not in params.existing_records[EntityType.USER]:
            raise Exception(
                f"Invalid Delegation transaction, user id {user_id} does not exist"
            )
        if not params.existing_records[EntityType.USER][user_id].wallet:
            raise Exception(
                "Programming error while indexing Delegation transaction, user wallet missing"
            )
        if (
            params.existing_records[EntityType.USER][user_id].wallet.lower()
            != params.signer.lower()
        ):
            raise Exception(
                "Invalid Delegation transaction, user does not match signer"
            )

    else:
        raise Exception(
            f"Invalid Delegation transaction, action {params.action} is not valid"
        )


def validate_delegation_record(delegation_record):
    if not all_required_fields_present(Delegation, delegation_record):
        raise EntityMissingRequiredFieldError(
            "delegation",
            delegation_record,
            f"Error parsing delegation {delegation_record} with entity missing required field(s)",
        )

    return delegation_record


def create_delegation(params: ManageEntityParameters):
    metadata = get_create_delegation_metadata_from_raw(params.metadata_cid)
    if not metadata:
        raise Exception("Invalid Delegation Transaction, unable to parse metadata")
    validate_delegation_tx(params, metadata)
    user_id = params.user_id
    if (
        metadata["delegate_address"]
        in params.existing_records[EntitySpecialFetchType.USER_BY_WALLET]
    ):
        delegate_type = "user"
    else:
        delegate_type = "app"
    delegation_record = Delegation(
        shared_address=cast(
            str, metadata["shared_address"]
        ),  # cast to assert non null (since we validated above)
        user_id=user_id,
        delegate_address=cast(
            str, metadata["delegate_address"]
        ),  # cast to assert non null (since we validated above)
        is_approved=False if delegate_type == "user" else True,
        txhash=params.txhash,
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
        created_at=params.block_datetime,
    )

    validate_delegation_record(delegation_record)
    params.add_delegation_record(metadata["shared_address"], delegation_record)
    return delegation_record
