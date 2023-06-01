import json
from typing import Optional, TypedDict, Union, cast

from src.models.grants.developer_app import DeveloperApp
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


class CreateDeveloperAppMetadata(TypedDict):
    address: Union[str, None]
    name: Union[str, None]
    is_personal_access: Union[bool, None]


class RevokeDeveloperAppMetadata(TypedDict):
    address: Union[str, None]


def get_developer_app_metadata_from_raw(
    raw_metadata: Optional[str],
) -> Optional[CreateDeveloperAppMetadata]:
    metadata: CreateDeveloperAppMetadata = {
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

            # CREATE only fields:
            metadata["name"] = json_metadata.get("name", None)
            metadata["is_personal_access"] = json_metadata.get(
                "is_personal_access", None
            )
            return metadata
        except Exception as e:
            logger.error(
                f"entity_manager | developer_app.py | Unable to parse developer app metadata while indexing: {e}"
            )
            return None
    return metadata


def validate_developer_app_tx(params: ManageEntityParameters, metadata):
    user_id = params.user_id

    if params.entity_type != EntityType.DEVELOPER_APP:
        raise Exception(
            f"Invalid Developer App Transaction, wrong entity type {params.entity_type}"
        )
    if not metadata["address"]:
        raise Exception(
            f"Invalid {params.action} Developer App Transaction, address is required and was not provided"
        )
    if not user_id:
        raise Exception(
            f"Invalid {params.action} Developer App Transaction, user id is required and was not provided"
        )
    if user_id not in params.existing_records[EntityType.USER]:
        raise Exception(
            f"Invalid {params.action} Developer App Transaction, user id {user_id} does not exist"
        )
    if not params.existing_records[EntityType.USER][user_id].wallet:
        raise Exception(
            f"Programming error while indexing {params.action} Developer App Transaction, user wallet missing"
        )
    if (
        params.existing_records[EntityType.USER][user_id].wallet.lower()
        != params.signer.lower()
    ):
        raise Exception(
            f"Invalid {params.action} Developer App Transaction, user does not match signer"
        )
    if params.action == Action.DELETE:
        if metadata["address"] not in params.existing_records[EntityType.DEVELOPER_APP]:
            raise Exception(
                f"Invalid Delete Developer App Transaction, developer app with address {metadata['address']} does not exist"
            )
        existing_developer_app = params.existing_records[EntityType.DEVELOPER_APP][
            metadata["address"]
        ]
        if user_id != existing_developer_app.user_id:
            raise Exception(
                f"Invalid Delete Developer App Transaction, user id {user_id} does not match given developer app address"
            )
    elif params.action == Action.CREATE:
        if not metadata["name"]:
            raise Exception(
                "Invalid Create Developer App Transaction, name is required and was not provided"
            )
        if metadata["address"] in params.existing_records[EntityType.DEVELOPER_APP]:
            raise Exception(
                f"Invalid Create Developer App Transaction, address {metadata['address']} already exists"
            )
        if metadata["is_personal_access"] != None and not isinstance(
            metadata["is_personal_access"], bool
        ):
            raise Exception(
                "Invalid Create Developer App Transaction, is_personal_access must be a boolean (or empty)"
            )
    else:
        raise Exception(
            f"Invalid Developer App Transaction, action {params.action} is not valid"
        )


def create_developer_app(params: ManageEntityParameters):
    metadata = get_developer_app_metadata_from_raw(params.metadata_cid)
    if not metadata:
        raise Exception("Invalid Developer App Transaction, unable to parse metadata")
    validate_developer_app_tx(params, metadata)
    user_id = params.user_id

    developer_app_record = DeveloperApp(
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
        is_current=True,
        updated_at=params.block_datetime,
        created_at=params.block_datetime,
    )

    validate_developer_app_record(developer_app_record)
    params.add_developer_app_record(metadata["address"], developer_app_record)
    return developer_app_record


def delete_developer_app(params: ManageEntityParameters):
    metadata = get_developer_app_metadata_from_raw(params.metadata_cid)
    if not metadata:
        raise Exception(
            "Invalid Revoke Developer App Transaction, unable to parse metadata"
        )
    validate_developer_app_tx(params, metadata)
    address = metadata["address"]
    existing_developer_app = params.existing_records[EntityType.DEVELOPER_APP][address]
    if metadata["address"] in params.new_records[EntityType.DEVELOPER_APP]:
        existing_developer_app = params.new_records[EntityType.DEVELOPER_APP][address][
            -1
        ]

    revoked_developer_app = copy_record(
        existing_developer_app,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )

    revoked_developer_app.is_delete = True

    validate_developer_app_record(revoked_developer_app)
    params.add_developer_app_record(address, revoked_developer_app)
    return revoked_developer_app


def validate_developer_app_record(developer_app_record):
    if not all_required_fields_present(DeveloperApp, developer_app_record):
        raise EntityMissingRequiredFieldError(
            "developer app",
            developer_app_record,
            f"Error parsing developer app {developer_app_record} with entity missing required field(s)",
        )

    return developer_app_record
