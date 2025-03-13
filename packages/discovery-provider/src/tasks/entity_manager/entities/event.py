from src.exceptions import IndexingValidationError
from src.models.events.event import Event
from src.tasks.entity_manager.utils import (
    EntityType,
    ManageEntityParameters,
    copy_record,
    validate_signer,
)
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)


def validate_create_event_tx(params: ManageEntityParameters):
    validate_signer(params)
    metadata = params.metadata

    required_fields = ["event_type"]
    for field in required_fields:
        if field not in metadata:
            raise IndexingValidationError(f"Missing required field: {field}")


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
        is_deleted=params.metadata["is_deleted"],
        created_at=params.block_datetime,
        updated_at=params.block_datetime,
        txhash=params.txhash,
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
    )

    params.add_record(event_id, event_record)


def validate_update_event_tx(params: ManageEntityParameters):
    validate_signer(params)
    event_id = params.entity_id
    user_id = params.user_id
    existing_event = params.existing_records[EntityType.EVENT.value][params.entity_id]

    if not existing_event:
        raise IndexingValidationError(
            f"Cannot update event {event_id} that does not exist"
        )

    if user_id != existing_event.user_id:
        raise IndexingValidationError(f"Only event owner can update event {event_id}")


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
    event_record.is_deleted = params.metadata.get("is_deleted", event_record.is_deleted)
    event_record.updated_at = params.block_datetime
    event_record.txhash = params.txhash
    event_record.blockhash = params.event_blockhash
    event_record.blocknumber = params.block_number

    params.add_record(params.entity_id, event_record, EntityType.EVENT)


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
    deleted_event = copy_record(
        existing_event,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )
    deleted_event.is_deleted = True

    params.add_record(event_id, deleted_event, EntityType.EVENT)
