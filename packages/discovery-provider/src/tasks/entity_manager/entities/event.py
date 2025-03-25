from datetime import datetime

from src.exceptions import IndexingValidationError
from src.models.events.event import Event
from src.tasks.entity_manager.utils import (
    EntityType,
    ManageEntityParameters,
    validate_signer,
)
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)


def validate_create_event_tx(params: ManageEntityParameters):
    validate_signer(params)
    metadata = params.metadata

    # Check if event_id already exists
    if params.entity_id in params.existing_records[EntityType.EVENT.value]:
        raise IndexingValidationError(
            f"Event with id {params.entity_id} already exists"
        )

    # Check if all required fields are present
    required_fields = ["event_type", "entity_id", "entity_type", "end_date", "user_id"]
    for field in required_fields:
        if field not in metadata:
            raise IndexingValidationError(f"Missing required field: {field}")

    # Validate end_date is in the future
    if metadata["end_date"] > datetime.now():
        raise IndexingValidationError("end_date must be in the future")

    # Validate entity_type is valid
    valid_entity_types = [
        EntityType.TRACK.value,
        EntityType.PLAYLIST.value,
        EntityType.USER.value,
    ]
    if (
        params.metadata.get("entity_type")
        and params.metadata["entity_type"] not in valid_entity_types
    ):
        raise IndexingValidationError(
            f"Invalid entity_type: {params.metadata['entity_type']}"
        )

    # Validate entity type is correct and entity exists
    if params.metadata["entity_type"] == EntityType.TRACK.value:
        if not params.existing_records[EntityType.TRACK.value].get(
            metadata["entity_id"]
        ):
            raise IndexingValidationError(
                f"Track with id {metadata['entity_id']} does not exist"
            )
    elif params.metadata["entity_type"] == EntityType.PLAYLIST.value:
        if not params.existing_records[EntityType.PLAYLIST.value].get(
            metadata["entity_id"]
        ):
            raise IndexingValidationError(
                f"Playlist with id {metadata['entity_id']} does not exist"
            )
    elif params.metadata["entity_type"] == EntityType.USER.value:
        if not params.existing_records[EntityType.USER.value].get(
            metadata["entity_id"]
        ):
            raise IndexingValidationError(
                f"User with id {metadata['entity_id']} does not exist"
            )
    else:
        raise IndexingValidationError(
            f"Invalid entity_type: {params.metadata['entity_type']}"
        )

    if not params.existing_records[EntityType.USER.value].get(params.user_id):
        raise IndexingValidationError(f"User with id {params.user_id} does not exist")

    # Validate remix competition rules
    if metadata["event_type"] == "remix_competition":
        if not metadata["entity_id"] or not metadata["entity_type"]:
            raise IndexingValidationError(
                "For remix competitions, entity_id and entity_type must be provided"
            )
        if any(
            event.entity_id == metadata["entity_id"]
            and event.event_type == "remix_competition"
            for event in params.existing_records[EntityType.EVENT.value].values()
        ):
            raise IndexingValidationError(
                f"An existing remix competition for entity_id {metadata['entity_id']} already exists"
            )


def create_event(params: ManageEntityParameters):
    validate_create_event_tx(params)

    event_id = params.entity_id
    event_record = Event(
        event_id=event_id,
        event_type=params.metadata["event_type"],
        user_id=params.user_id,
        entity_type=params.metadata["entity_type"],
        entity_id=params.metadata["entity_id"],
        end_date=params.metadata["end_date"],
        event_data=params.metadata["event_data"],
        is_deleted=False,
        created_at=params.block_datetime,
        updated_at=params.block_datetime,
        txhash=params.txhash,
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
    )

    params.session.add(event_record)


def validate_update_event_tx(params: ManageEntityParameters):
    validate_signer(params)
    event_id = params.entity_id
    user_id = params.user_id
    existing_event = params.existing_records[EntityType.EVENT.value].get(event_id)

    if not existing_event:
        raise IndexingValidationError(
            f"Cannot update event {event_id} that does not exist"
        )

    if user_id != existing_event.user_id:
        raise IndexingValidationError(f"Only event owner can update event {event_id}")

    # Validate end_date is not in the past
    if params.metadata.get("end_date") and params.metadata["end_date"] < datetime.now():
        raise IndexingValidationError("end_date cannot be in the past")


def update_event(params: ManageEntityParameters):
    validate_update_event_tx(params)
    event_record = params.existing_records[EntityType.EVENT.value][params.entity_id]

    # Update the event record with new values from params.metadata
    event_record.event_type = params.metadata.get("event_type", event_record.event_type)
    event_record.entity_type = params.metadata.get(
        "entity_type", event_record.entity_type
    )
    event_record.entity_id = params.metadata.get("entity_id", event_record.entity_id)
    event_record.end_date = params.metadata.get("end_date", event_record.end_date)
    event_record.event_data = params.metadata.get("event_data", event_record.event_data)
    event_record.is_deleted = event_record.is_deleted
    event_record.updated_at = params.block_datetime
    event_record.txhash = params.txhash
    event_record.blockhash = params.event_blockhash
    event_record.blocknumber = params.block_number


def validate_delete_event_tx(params: ManageEntityParameters):
    validate_signer(params)
    event_id = params.entity_id
    user_id = params.user_id
    existing_event = params.existing_records[EntityType.EVENT.value][params.entity_id]

    if not existing_event:
        raise IndexingValidationError(
            f"Cannot delete event {event_id} that does not exist"
        )

    if user_id != existing_event.user_id:
        raise IndexingValidationError(f"Only event owner can delete event {event_id}")


def delete_event(params: ManageEntityParameters):
    validate_delete_event_tx(params)
    event_id = params.entity_id
    existing_event = params.existing_records[EntityType.EVENT.value][event_id]
    if params.entity_id in params.new_records[EntityType.EVENT.value]:
        existing_event = params.new_records[EntityType.EVENT.value][params.entity_id][
            -1
        ]

    existing_event.is_deleted = True
