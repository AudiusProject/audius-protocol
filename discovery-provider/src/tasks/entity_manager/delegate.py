import json
import logging
from typing import Optional, TypedDict, Union

from src.models.delegates.delegate import Delegate
from src.tasks.entity_manager.utils import (
    USER_ID_OFFSET,
    Action,
    EntityType,
    ManageEntityParameters,
)
from src.utils.indexing_errors import EntityMissingRequiredFieldError
from src.utils.model_nullable_validator import all_required_fields_present

logger = logging.getLogger(__name__)


class CreateDelegateMetadata(TypedDict):
    address: Union[str, None]
    name: Union[str, None]
    is_personal_access: Union[bool, None]


def get_create_delegate_metadata_from_raw(
    raw_metadata: Optional[str],
) -> CreateDelegateMetadata:
    metadata = {"address": None, "name": None, "is_personal_access": None}
    if raw_metadata:
        try:
            json_metadata = json.loads(raw_metadata)
            raw_address = json_metadata.get("address", None)
            if raw_address:
                metadata["address"] = raw_address.lower()
            else:
                metadata["address"] = None
            metadata["name"] = json_metadata.get("name", None)
            metadata["is_personal_access"] = json_metadata.get(
                "is_personal_access", None
            )
            return metadata
        except Exception as e:
            logger.error(
                f"entity_manager | delegate.py | Unable to parse delegate metadata while indexing: {e}"
            )
            return None
    return metadata


def validate_delegate_tx(
    params: ManageEntityParameters, metadata: CreateDelegateMetadata
):
    user_id = params.user_id

    if params.entity_type != EntityType.DELEGATE:
        raise Exception(
            f"Invalid Delegate Transaction, wrong entity type {params.entity_type}"
        )

    if params.action == Action.CREATE:
        if not metadata["address"]:
            raise Exception(
                "Invalid Delegate Transaction, address is required and was not provided"
            )
        if not metadata["name"]:
            raise Exception(
                "Invalid Delegate Transaction, name is required and was not provided"
            )
        if metadata["address"].lower() in params.existing_records[EntityType.DELEGATE]:
            raise Exception(
                f"Invalid Delegate Transaction, address {metadata['address']} already exists"
            )
        if user_id and user_id not in params.existing_records[EntityType.USER]:
            raise Exception(
                f"Invalid Delegate Transaction, user id {user_id} does not exist"
            )

        if metadata["address"].lower() != params.signer.lower():
            raise Exception(
                "Invalid Delegate Transaction, delegate wallet signer does not match delegate address"
            )

        if not isinstance(metadata["is_personal_access"], bool):
            raise Exception(
                "Invalid Delegate Transaction, is_personal_access must be a boolean (or empty)"
            )

    else:
        raise Exception(
            f"Invalid Delegate Transaction, action {params.action} is not valid"
        )


def create_delegate(params: ManageEntityParameters):
    metadata = get_create_delegate_metadata_from_raw(params.metadata_cid)
    if not metadata:
        raise Exception("Invalid Delegate Transaction, unable to parse metadata")
    validate_delegate_tx(params, metadata)
    user_id = params.user_id

    delegate_record = Delegate(
        user_id=user_id,
        name=metadata["name"],
        address=metadata["address"],
        is_personal_access=metadata["is_personal_access"],
        txhash=params.txhash,
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
        created_at=params.block_datetime,
    )

    validate_delegate_record(delegate_record)
    params.add_delegate_record(metadata["address"], delegate_record)
    return delegate_record


def validate_delegate_record(delegate_record):
    if not all_required_fields_present(Delegate, delegate_record):
        raise EntityMissingRequiredFieldError(
            "delegate",
            delegate_record,
            f"Error parsing delegate {delegate_record} with entity missing required field(s)",
        )

    return delegate_record
