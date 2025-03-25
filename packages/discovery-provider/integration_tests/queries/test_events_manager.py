import logging
from datetime import datetime, timedelta

from integration_tests.utils import populate_mock_db
from src.exceptions import IndexingValidationError
from src.tasks.entity_manager.entities.event import (
    create_event,
    delete_event,
    update_event,
    validate_create_event_tx,
    validate_delete_event_tx,
    validate_update_event_tx,
)
from src.tasks.entity_manager.utils import EntityType, ManageEntityParameters
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)

# Test data for events
test_entities = {
    "events": [
        {
            "event_id": 1,
            "event_type": "challenge",
            "user_id": 1,
            "entity_type": "Track",
            "entity_id": 1,
            "end_date": datetime.now() + timedelta(days=7),
            "is_deleted": False,
            "created_at": datetime(2024, 1, 1),
            "updated_at": datetime(2024, 1, 1),
            "txhash": "0x123",
            "blockhash": "0xabc",
            "blocknumber": 1000,
        },
        {
            "event_id": 2,
            "event_type": "challenge",
            "user_id": 2,
            "entity_type": "Track",
            "entity_id": 2,
            "end_date": datetime.now() + timedelta(days=14),
            "is_deleted": False,
            "created_at": datetime(2024, 1, 2),
            "updated_at": datetime(2024, 1, 2),
            "txhash": "0x456",
            "blockhash": "0xdef",
            "blocknumber": 1001,
        },
    ],
    "users": [
        {"user_id": 1, "handle": "user1"},
        {"user_id": 2, "handle": "user2"},
    ],
    "tracks": [
        {"track_id": 1, "title": "Track 1", "owner_id": 1},
        {"track_id": 2, "title": "Track 2", "owner_id": 2},
    ],
}


def test_create_event(app):
    """Test creating a new event"""
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)

        # Create event parameters
        event_id = 3
        user_id = 1
        block_datetime = datetime.now()
        metadata = {
            "event_type": "challenge",
            "entity_type": "Track",
            "entity_id": 1,
            "end_date": block_datetime + timedelta(days=7),
            "is_deleted": False,
        }

        params = ManageEntityParameters(
            entity_type=EntityType.EVENT,
            entity_id=event_id,
            user_id=user_id,
            metadata=metadata,
            block_datetime=block_datetime,
            txhash="0x789",
            event_blockhash="0xghi",
            block_number=1002,
        )

        # Test validation
        validate_create_event_tx(params)

        # Test creation
        create_event(params)

        # Verify the event was created
        created_event = params.new_records[EntityType.EVENT.value][event_id][-1]
        assert created_event.event_id == event_id
        assert created_event.user_id == user_id
        assert created_event.event_type == metadata["event_type"]
        assert created_event.entity_type == metadata["entity_type"]
        assert created_event.entity_id == metadata["entity_id"]
        assert created_event.end_date == metadata["end_date"]
        assert created_event.is_deleted == metadata["is_deleted"]


def test_update_event(app):
    """Test updating an existing event"""
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)

        # Update event parameters
        event_id = 1
        user_id = 1
        block_datetime = datetime.now()
        metadata = {
            "event_type": "updated_challenge",
            "end_date": block_datetime + timedelta(days=10),
        }

        params = ManageEntityParameters(
            entity_type=EntityType.EVENT,
            entity_id=event_id,
            user_id=user_id,
            metadata=metadata,
            block_datetime=block_datetime,
            txhash="0x789",
            event_blockhash="0xghi",
            block_number=1002,
            existing_records={
                EntityType.EVENT.value: {event_id: test_entities["events"][0]}
            },
        )

        # Test validation
        validate_update_event_tx(params)

        # Test update
        update_event(params)

        # Verify the event was updated
        updated_event = params.new_records[EntityType.EVENT.value][event_id][-1]
        assert updated_event.event_id == event_id
        assert updated_event.event_type == metadata["event_type"]
        assert updated_event.end_date == metadata["end_date"]


def test_delete_event(app):
    """Test deleting an existing event"""
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)

        # Delete event parameters
        event_id = 1
        user_id = 1
        block_datetime = datetime.now()

        params = ManageEntityParameters(
            entity_type=EntityType.EVENT,
            entity_id=event_id,
            user_id=user_id,
            metadata={},
            block_datetime=block_datetime,
            txhash="0x789",
            event_blockhash="0xghi",
            block_number=1002,
            existing_records={
                EntityType.EVENT.value: {event_id: test_entities["events"][0]}
            },
        )

        # Test validation
        validate_delete_event_tx(params)

        # Test deletion
        delete_event(params)

        # Verify the event was marked as deleted
        deleted_event = params.new_records[EntityType.EVENT.value][event_id][-1]
        assert deleted_event.is_deleted == True


def test_validation_errors(app):
    """Test various validation error cases"""
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)

        # Test missing required field in create
        params = ManageEntityParameters(
            entity_type=EntityType.EVENT,
            entity_id=3,
            user_id=1,
            metadata={},  # Missing event_type
            block_datetime=datetime.now(),
            txhash="0x789",
            event_blockhash="0xghi",
            block_number=1002,
        )
        try:
            validate_create_event_tx(params)
            assert False, "Should have raised IndexingValidationError"
        except IndexingValidationError as e:
            assert "Missing required field: event_type" in str(e)

        # Test updating non-existent event
        params = ManageEntityParameters(
            entity_type=EntityType.EVENT,
            entity_id=999,  # Non-existent event
            user_id=1,
            metadata={"event_type": "challenge"},
            block_datetime=datetime.now(),
            txhash="0x789",
            event_blockhash="0xghi",
            block_number=1002,
            existing_records={EntityType.EVENT.value: {}},
        )
        try:
            validate_update_event_tx(params)
            assert False, "Should have raised IndexingValidationError"
        except IndexingValidationError as e:
            assert "Cannot update event" in str(e)

        # Test unauthorized update
        params = ManageEntityParameters(
            entity_type=EntityType.EVENT,
            entity_id=1,
            user_id=2,  # Different user
            metadata={"event_type": "challenge"},
            block_datetime=datetime.now(),
            txhash="0x789",
            event_blockhash="0xghi",
            block_number=1002,
            existing_records={EntityType.EVENT.value: {1: test_entities["events"][0]}},
        )
        try:
            validate_update_event_tx(params)
            assert False, "Should have raised IndexingValidationError"
        except IndexingValidationError as e:
            assert "Only event owner can update event" in str(e)

        # Test unauthorized delete
        try:
            validate_delete_event_tx(params)
            assert False, "Should have raised IndexingValidationError"
        except IndexingValidationError as e:
            assert "Only event owner can delete event" in str(e)
