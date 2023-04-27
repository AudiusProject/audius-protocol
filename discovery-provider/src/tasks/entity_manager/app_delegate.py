import json
from typing import Optional, TypedDict, Union, cast

from src.models.delegates.app_delegate import AppDelegate
from src.tasks.entity_manager.utils import Action, EntityType, ManageEntityParameters
from src.utils.indexing_errors import EntityMissingRequiredFieldError
from src.utils.model_nullable_validator import all_required_fields_present
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)


class CreateAppDelegateMetadata(TypedDict):
    address: Union[str, None]
    name: Union[str, None]
    is_personal_access: Union[bool, None]


def get_create_app_delegate_metadata_from_raw(
    raw_metadata: Optional[str],
) -> Optional[CreateAppDelegateMetadata]:
    metadata: CreateAppDelegateMetadata = {
        "address": None,
        "name": None,
        "is_personal_access": None,
    }
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


def validate_app_delegate_tx(
    params: ManageEntityParameters, metadata: CreateAppDelegateMetadata
):
    user_id = params.user_id

    if params.entity_type != EntityType.APP_DELEGATE:
        raise Exception(
            f"Invalid AppDelegate Transaction, wrong entity type {params.entity_type}"
        )

    if params.action == Action.CREATE:
        if not metadata["address"]:
            raise Exception(
                "Invalid AppDelegate Transaction, address is required and was not provided"
            )
        if not metadata["name"]:
            raise Exception(
                "Invalid AppDelegate Transaction, name is required and was not provided"
            )
        if (
            metadata["address"].lower()
            in params.existing_records[EntityType.APP_DELEGATE]
        ):
            raise Exception(
                f"Invalid AppDelegate Transaction, address {metadata['address']} already exists"
            )
        if not user_id:
            raise Exception(
                "Invalid AppDelegate Transaction, user id is required and was not provided"
            )
        if user_id not in params.existing_records[EntityType.USER]:
            raise Exception(
                f"Invalid AppDelegate Transaction, user id {user_id} does not exist"
            )
        if not params.existing_records[EntityType.USER][user_id].wallet:
            raise Exception(
                "Programming error while indexing AppDelegate Transaction, user wallet missing"
            )
        if (
            params.existing_records[EntityType.USER][user_id].wallet.lower()
            != params.signer.lower()
        ):
            raise Exception(
                "Invalid AppDelegate Transaction, user does not match signer"
            )
        if not isinstance(metadata["is_personal_access"], bool):
            raise Exception(
                "Invalid AppDelegate Transaction, is_personal_access must be a boolean (or empty)"
            )

    else:
        raise Exception(
            f"Invalid AppDelegate Transaction, action {params.action} is not valid"
        )


def create_app_delegate(params: ManageEntityParameters):
    metadata = get_create_app_delegate_metadata_from_raw(params.metadata_cid)
    if not metadata:
        raise Exception("Invalid AppDelegate Transaction, unable to parse metadata")
    validate_app_delegate_tx(params, metadata)
    user_id = params.user_id

    delegate_record = AppDelegate(
        user_id=user_id,
        name=cast(
            str, metadata["name"]
        ),  # cast to assert non null (since we validated above)
        address=cast(
            str, metadata["address"]
        ),  # cast to assert non null (since we validated above)
        is_personal_access=(metadata["is_personal_access"] or False),
        txhash=params.txhash,
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
        created_at=params.block_datetime,
    )

    validate_app_delegate_record(delegate_record)
    params.add_app_delegate_record(metadata["address"], delegate_record)
    return delegate_record


def validate_app_delegate_record(delegate_record):
    if not all_required_fields_present(AppDelegate, delegate_record):
        raise EntityMissingRequiredFieldError(
            "delegate",
            delegate_record,
            f"Error parsing delegate {delegate_record} with entity missing required field(s)",
        )

    return delegate_record
