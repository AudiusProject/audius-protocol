import json
import logging
from datetime import datetime, timedelta

from web3 import Web3
from web3.datastructures import AttributeDict

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.challenges.challenge_event_bus import ChallengeEventBus, setup_challenge_bus
from src.models.events.event import Event, EventEntityType, EventType
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.utils import Action, EntityType
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)

# Test data for events
block_datetime = datetime.now()
test_entities = {
    "events": [
        {
            "event_id": 1,
            "event_type": EventType.remix_contest,
            "user_id": 1,
            "entity_type": EventEntityType.track,
            "entity_id": 1,
            "end_date": block_datetime + timedelta(days=7),
            "is_deleted": False,
            "created_at": datetime(2024, 1, 1),
            "updated_at": datetime(2024, 1, 1),
            "txhash": "0x123",
            "blockhash": "0xabc",
            "blocknumber": 1000,
        },
        {
            "event_id": 2,
            "event_type": EventType.remix_contest,
            "user_id": 2,
            "entity_type": EventEntityType.track,
            "entity_id": 2,
            "end_date": block_datetime + timedelta(days=14),
            "is_deleted": False,
            "created_at": datetime(2024, 1, 2),
            "updated_at": datetime(2024, 1, 2),
            "txhash": "0x456",
            "blockhash": "0xdef",
            "blocknumber": 1001,
        },
    ],
    "users": [
        {"user_id": 1, "handle": "user1", "wallet": "user1wallet"},
        {"user_id": 2, "handle": "user2", "wallet": "user2wallet"},
    ],
    "tracks": [
        {"track_id": 1, "title": "Track 1", "owner_id": 1},
        {"track_id": 2, "title": "Track 2", "owner_id": 2},
        {"track_id": 3, "title": "Track 3", "owner_id": 1},
    ],
}


def setup_test(app, mocker, entities, tx_receipts):
    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        challenge_event_bus: ChallengeEventBus = setup_challenge_bus()
        update_task = UpdateTask(web3, challenge_event_bus)

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts[tx_receipt["transactionHash"].decode("utf-8")]

    mocker.patch(
        "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
        side_effect=get_events_side_effect,
        autospec=True,
    )

    if isinstance(entities, list):
        for entity_set in entities:
            populate_mock_db(db, entity_set)
    else:
        populate_mock_db(db, entities)

    def index_transaction(session):
        return entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=datetime.now().timestamp(),
            block_hash=hex(0),
        )

    return db, index_transaction


def setup_test_without_mock(app, tx_receipts):
    # setup db and txs without mocking
    with app.app_context():
        db = get_db()
        web3 = Web3()
        challenge_event_bus: ChallengeEventBus = setup_challenge_bus()
        update_task = UpdateTask(web3, challenge_event_bus)

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    def index_transaction(session):
        return entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=datetime.now().timestamp(),
            block_hash=hex(0),
        )

    return db, index_transaction


def test_create_event(app, mocker):
    """Test creating a new event"""
    block_datetime = datetime.now()
    metadata = {
        "event_type": EventType.remix_contest,
        "entity_type": EventEntityType.track,
        "entity_id": 3,  # Track 3 - no existing remix contest
        "end_date": (block_datetime + timedelta(days=7)).isoformat(),
        "is_deleted": False,
        "event_data": {
            # Random event data here
            "title": "Test Remix Contest",
            "description": "Test description",
        },
    }

    tx_receipts = {
        "CreateEvent": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 3,
                        "_entityType": EntityType.EVENT,
                        "_userId": 1,
                        "_action": Action.CREATE,
                        "_metadata": f'{{"cid": "", "data": {json.dumps(metadata)}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    db, index_transaction = setup_test(app, mocker, test_entities, tx_receipts)

    with db.scoped_session() as session:
        index_transaction(session)

        # Verify the event was created
        created_event = session.query(Event).filter_by(event_id=3).first()
        assert created_event.event_id == 3
        assert created_event.user_id == 1
        assert created_event.event_type == metadata["event_type"]
        assert created_event.entity_type == metadata["entity_type"]
        assert created_event.entity_id == metadata["entity_id"]
        assert created_event.end_date.isoformat() == metadata["end_date"]
        assert created_event.is_deleted == False


def test_update_event(app, mocker):
    """Test updating an existing event"""
    block_datetime = datetime.now()
    metadata = {
        "end_date": (block_datetime + timedelta(days=10)).isoformat(),
    }

    tx_receipts = {
        "UpdateEvent": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": EntityType.EVENT,
                        "_userId": 1,
                        "_action": Action.UPDATE,
                        "_metadata": f'{{"cid": "", "data": {json.dumps(metadata)}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    db, index_transaction = setup_test(app, mocker, test_entities, tx_receipts)

    with db.scoped_session() as session:
        index_transaction(session)

        # Verify the event was updated
        updated_event = session.query(Event).filter_by(event_id=1).first()
        assert updated_event.event_id == 1
        assert updated_event.end_date.isoformat() == metadata["end_date"]


def test_update_event_with_past_end_date(app, mocker):
    """Test that updating an event with an end_date in the past fails validation"""
    # Use a past date for the end_date
    block_datetime = datetime.now()
    metadata = {
        "end_date": (block_datetime - timedelta(days=1)).isoformat(),
    }

    tx_receipts = {
        "UpdateEventWithPastDate": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": EntityType.EVENT,
                        "_userId": 1,
                        "_action": Action.UPDATE,
                        "_metadata": f'{{"cid": "", "data": {json.dumps(metadata)}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    db, index_transaction = setup_test(app, mocker, test_entities, tx_receipts)

    with db.scoped_session() as session:
        # Get the original event's end_date before attempting update
        original_event = session.query(Event).filter_by(event_id=1).first()
        original_end_date = original_event.end_date

        # Try to update with invalid end_date
        index_transaction(session)

        # Verify the event was NOT updated - end_date should remain unchanged
        updated_event = session.query(Event).filter_by(event_id=1).first()
        assert updated_event.end_date == original_end_date
        assert updated_event.end_date.isoformat() != metadata["end_date"]


def test_update_event_with_invalid_end_date_format(app, mocker):
    """Test that updating an event with an invalid end_date format fails validation"""
    metadata = {
        "end_date": "not-a-valid-iso-date",  # Invalid date format
    }

    tx_receipts = {
        "UpdateEventWithInvalidDate": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": EntityType.EVENT,
                        "_userId": 1,
                        "_action": Action.UPDATE,
                        "_metadata": f'{{"cid": "", "data": {json.dumps(metadata)}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    db, index_transaction = setup_test(app, mocker, test_entities, tx_receipts)

    with db.scoped_session() as session:
        # Get the original event's end_date before attempting update
        original_event = session.query(Event).filter_by(event_id=1).first()
        original_end_date = original_event.end_date

        # Try to update with invalid end_date format
        index_transaction(session)

        # Verify the event was NOT updated - end_date should remain unchanged
        updated_event = session.query(Event).filter_by(event_id=1).first()
        assert updated_event.event_id == 1
        assert updated_event.end_date == original_end_date


def test_delete_event(app, mocker):
    """Test deleting an existing event"""
    tx_receipts = {
        "DeleteEvent": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": EntityType.EVENT,
                        "_userId": 1,
                        "_action": Action.DELETE,
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    db, index_transaction = setup_test(app, mocker, test_entities, tx_receipts)

    with db.scoped_session() as session:
        index_transaction(session)

        # Verify the event was marked as deleted
        deleted_event = session.query(Event).filter_by(event_id=1).first()
        assert deleted_event.is_deleted == True


def test_create_duplicate_remix_contest_fails(app, mocker):
    """Test that creating a duplicate remix contest for the same entity_id fails validation"""
    block_datetime = datetime.now()
    metadata = {
        "event_type": EventType.remix_contest,
        "entity_type": EventEntityType.track,
        "entity_id": 1,  # Same entity_id as the existing event in test_entities
        "end_date": (block_datetime + timedelta(days=7)).isoformat(),
        "is_deleted": False,
        "event_data": {
            "title": "Another Remix Contest",
            "description": "This should fail",
        },
    }

    tx_receipts = {
        "CreateDuplicateRemixContest": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 4,
                        "_entityType": EntityType.EVENT,
                        "_userId": 1,
                        "_action": Action.CREATE,
                        "_metadata": f'{{"cid": "", "data": {json.dumps(metadata)}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    db, index_transaction = setup_test(app, mocker, test_entities, tx_receipts)

    with db.scoped_session() as session:
        # Get count of events before attempting to create duplicate
        initial_event_count = session.query(Event).count()

        # Try to create duplicate remix contest
        index_transaction(session)

        # Verify no new event was created (due to validation failure)
        final_event_count = session.query(Event).count()
        assert final_event_count == initial_event_count

        # Verify the duplicate event with id 4 was not created
        duplicate_event = session.query(Event).filter_by(event_id=4).first()
        assert duplicate_event is None


def test_create_remix_contest_after_previous_ended(app, mocker):
    """Test that creating a remix contest succeeds when previous contest for same track has ended"""
    block_datetime = datetime.now()

    # Create test data with an ended remix contest
    test_entities_with_ended_contest = {
        "events": [
            {
                "event_id": 10,
                "event_type": EventType.remix_contest,
                "user_id": 1,
                "entity_type": EventEntityType.track,
                "entity_id": 1,
                "end_date": block_datetime - timedelta(days=1),  # Ended yesterday
                "is_deleted": False,
                "created_at": datetime(2024, 1, 1),
                "updated_at": datetime(2024, 1, 1),
                "txhash": "0x123",
                "blockhash": "0xabc",
                "blocknumber": 1000,
            },
        ],
        "users": [
            {"user_id": 1, "handle": "user1", "wallet": "user1wallet"},
        ],
        "tracks": [
            {"track_id": 1, "title": "Track 1", "owner_id": 1},
        ],
    }

    metadata = {
        "event_type": EventType.remix_contest,
        "entity_type": EventEntityType.track,
        "entity_id": 1,  # Same entity_id as the ended contest
        "end_date": (block_datetime + timedelta(days=7)).isoformat(),
        "is_deleted": False,
        "event_data": {
            "title": "New Remix Contest",
            "description": "This should succeed since previous contest ended",
        },
    }

    tx_receipts = {
        "CreateNewRemixContest": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 11,
                        "_entityType": EntityType.EVENT,
                        "_userId": 1,
                        "_action": Action.CREATE,
                        "_metadata": f'{{"cid": "", "data": {json.dumps(metadata)}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    db, index_transaction = setup_test(
        app, mocker, test_entities_with_ended_contest, tx_receipts
    )

    with db.scoped_session() as session:
        index_transaction(session)

        # Verify the new event was created successfully
        created_event = session.query(Event).filter_by(event_id=11).first()
        assert created_event is not None
        assert created_event.event_id == 11
        assert created_event.user_id == 1
        assert created_event.event_type == metadata["event_type"]
        assert created_event.entity_type == metadata["entity_type"]
        assert created_event.entity_id == metadata["entity_id"]
        assert created_event.end_date.isoformat() == metadata["end_date"]
        assert created_event.is_deleted == False


def test_remix_contest_winners_selected_notification(app, mocker):
    """Test that fan_remix_contest_winners_selected notification is created when winners are first selected"""
    block_datetime = datetime.now()

    # Create test data with a remix contest without winners
    test_entities_remix_contest = {
        "events": [
            {
                "event_id": 20,
                "event_type": EventType.remix_contest,
                "user_id": 1,
                "entity_type": EventEntityType.track,
                "entity_id": 1,
                "end_date": block_datetime + timedelta(days=7),
                "event_data": {
                    "title": "Test Remix Contest",
                    "description": "Test description",
                    "winners": [],  # No winners initially
                },
                "is_deleted": False,
                "created_at": datetime(2024, 1, 1),
                "updated_at": datetime(2024, 1, 1),
                "txhash": "0x123",
                "blockhash": "0xabc",
                "blocknumber": 1000,
            },
        ],
        "users": [
            {"user_id": 1, "handle": "user1", "wallet": "user1wallet"},
            {"user_id": 2, "handle": "user2", "wallet": "user2wallet"},
        ],
        "tracks": [
            {"track_id": 1, "title": "Track 1", "owner_id": 1},
            {
                "track_id": 2,
                "title": "Winning Remix",
                "owner_id": 2,
            },  # This will be the winner
            {"track_id": 3, "title": "Track 3", "owner_id": 1},
        ],
    }

    # Mock the notification creation function
    mock_notification = mocker.patch(
        "src.tasks.entity_manager.entities.event.create_fan_remix_contest_winners_selected_notification",
        autospec=True,
    )

    # Update metadata to add winners
    metadata = {
        "event_data": {
            "title": "Test Remix Contest",
            "description": "Test description",
            "winners": [2],  # Track 2 is the winner
        },
    }

    tx_receipts = {
        "UpdateRemixContestWithWinners": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 20,
                        "_entityType": EntityType.EVENT,
                        "_userId": 1,
                        "_action": Action.UPDATE,
                        "_metadata": f'{{"cid": "", "data": {json.dumps(metadata)}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    db, index_transaction = setup_test(
        app, mocker, test_entities_remix_contest, tx_receipts
    )

    with db.scoped_session() as session:
        index_transaction(session)

        # Verify the event was updated with winners
        updated_event = session.query(Event).filter_by(event_id=20).first()
        assert updated_event.event_data["winners"] == [2]

        # Verify the notification function was called
        mock_notification.assert_called_once()

        # Get the arguments passed to the notification function
        call_args = mock_notification.call_args
        assert call_args[0][1] == 20  # event_id
        # The session and block_datetime are also passed but harder to assert exactly


def test_remix_contest_winners_notification_not_triggered_on_subsequent_updates(
    app, mocker
):
    """Test that notification is NOT triggered when winners are updated (not first time)"""
    block_datetime = datetime.now()

    # Create test data with a remix contest that already has winners
    test_entities_with_winners = {
        "events": [
            {
                "event_id": 21,
                "event_type": EventType.remix_contest,
                "user_id": 1,
                "entity_type": EventEntityType.track,
                "entity_id": 1,
                "end_date": block_datetime + timedelta(days=7),
                "event_data": {
                    "title": "Test Remix Contest",
                    "description": "Test description",
                    "winners": [2],  # Already has winners
                },
                "is_deleted": False,
                "created_at": datetime(2024, 1, 1),
                "updated_at": datetime(2024, 1, 1),
                "txhash": "0x123",
                "blockhash": "0xabc",
                "blocknumber": 1000,
            },
        ],
        "users": [
            {"user_id": 1, "handle": "user1", "wallet": "user1wallet"},
        ],
        "tracks": [
            {"track_id": 1, "title": "Track 1", "owner_id": 1},
            {"track_id": 2, "title": "Winning Remix", "owner_id": 1},
            {"track_id": 3, "title": "Another Remix", "owner_id": 1},
        ],
    }

    # Mock the notification creation function
    mock_notification = mocker.patch(
        "src.tasks.entity_manager.entities.event.create_fan_remix_contest_winners_selected_notification",
        autospec=True,
    )

    # Update metadata to change winners (add another winner)
    metadata = {
        "event_data": {
            "title": "Test Remix Contest",
            "description": "Test description",
            "winners": [2, 3],  # Adding another winner
        },
    }

    tx_receipts = {
        "UpdateRemixContestAddWinner": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 21,
                        "_entityType": EntityType.EVENT,
                        "_userId": 1,
                        "_action": Action.UPDATE,
                        "_metadata": f'{{"cid": "", "data": {json.dumps(metadata)}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    db, index_transaction = setup_test(
        app, mocker, test_entities_with_winners, tx_receipts
    )

    with db.scoped_session() as session:
        index_transaction(session)

        # Verify the event was updated
        updated_event = session.query(Event).filter_by(event_id=21).first()
        assert updated_event.event_data["winners"] == [2, 3]

        # Verify the notification function was NOT called (since winners already existed)
        mock_notification.assert_not_called()
